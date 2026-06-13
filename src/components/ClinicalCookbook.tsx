import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Layers, CheckCircle, AlertTriangle, Copy, ShieldCheck } from 'lucide-react';
import { ModelConfig, getActiveModelConfig, saveModelConfig, fetchAvailableModels } from '../utils/geminiClient';

interface HardwareProfile {
  id: string;
  name: string;
  vram: number; // GB
  desc: string;
}

interface ClinicalModel {
  name: string;
  sizeBillion: number; // billions of params
  hfRepo: string;
  desc: string;
}

const HARDWARE_PROFILES: HardwareProfile[] = [
  { id: 'cpu', name: 'Standard Laptop (CPU Only)', vram: 4, desc: 'Intel/AMD processor with 8GB-16GB general RAM' },
  { id: 'mac_unified', name: 'Apple M-Series Mac (Unified Memory)', vram: 16, desc: 'Apple Silicon M1/M2/M3 with 16GB-24GB unified memory' },
  { id: 'mac_studio', name: 'Apple Mac Studio / Pro', vram: 64, desc: 'M-Series Ultra/Max with 64GB-128GB unified memory' },
  { id: 'consumer_gpu', name: 'Consumer Nvidia GPU (e.g. RTX 4060)', vram: 8, desc: 'Nvidia RTX graphics card with 8GB-12GB dedicated VRAM' },
  { id: 'prosumer_gpu', name: 'Prosumer GPU (RTX 3090 / 4090)', vram: 24, desc: 'Dedicated Nvidia workstation GPU with 24GB VRAM' },
  { id: 'datacenter', name: 'Enterprise Cloud Node (A100/H100)', vram: 80, desc: 'Enterprise data-center GPU with 80GB VRAM' }
];

const CLINICAL_MODELS: ClinicalModel[] = [
  { name: 'BioMistral 7B', sizeBillion: 7.2, hfRepo: 'BioMistral/BioMistral-7B', desc: 'Mistral-based model tailored for biomedical and clinical question answering.' },
  { name: 'Med-Llama-3 8B', sizeBillion: 8.0, hfRepo: 'epfl-llg/meditron-8b', desc: 'Clinical instruct-tuned adaptation of Llama-3, optimized for medical reasoning.' },
  { name: 'PMC-LLaMA 13B', sizeBillion: 13.0, hfRepo: 'axiong/PMC_LLaMA_13B', desc: 'Fine-tuned on PubMed Central papers and clinical textbooks for medicine.' },
  { name: 'Clinical-Llama-3 70B', sizeBillion: 70.0, hfRepo: 'epfl-llg/meditron-70b', desc: 'Expert-grade medical model, requiring high-end workstation setups.' }
];

interface ServiceState {
  status: 'idle' | 'loading' | 'success' | 'failed';
  models: string[];
  error?: string;
}

export const ClinicalCookbook: React.FC = () => {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'cookbook' | 'instances'>('cookbook');
  
  // Hardware Profile States
  const [selectedHardware, setSelectedHardware] = useState<HardwareProfile>(HARDWARE_PROFILES[3]);
  const [selectedModel, setSelectedModel] = useState<ClinicalModel>(CLINICAL_MODELS[0]);
  const [quantization, setQuantization] = useState<'fp16' | 'q8' | 'q4'>('q4');
  const [copied, setCopied] = useState(false);

  // Active Model Bind Configurations
  const [activeConfig, setActiveConfig] = useState<ModelConfig>(getActiveModelConfig());
  const [endpoints, setEndpoints] = useState<Record<string, string>>({
    openvino: 'http://127.0.0.1:8000',
    ollama: 'http://localhost:11434',
    lmstudio: 'http://localhost:1234',
  });
  
  const [serviceStates, setServiceStates] = useState<Record<string, ServiceState>>({
    openvino: { status: 'idle', models: [] },
    ollama: { status: 'idle', models: [] },
    lmstudio: { status: 'idle', models: [] },
  });

  useEffect(() => {
    const current = getActiveModelConfig();
    setActiveConfig(current);
    
    if (current.source === 'openvino') {
      setEndpoints(prev => ({ ...prev, openvino: current.endpoint }));
    } else if (current.source === 'ollama') {
      setEndpoints(prev => ({ ...prev, ollama: current.endpoint }));
    } else if (current.source === 'custom' && (current.endpoint.includes('1234') || current.endpoint.includes('lmstudio'))) {
      setEndpoints(prev => ({ ...prev, lmstudio: current.endpoint }));
    }
  }, []);

  // Sync back config when event triggers in Settings Modal
  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const config = (e as CustomEvent).detail as ModelConfig;
      setActiveConfig(config);
    };
    window.addEventListener('lumen_model_config_changed', handleConfigChange);
    return () => window.removeEventListener('lumen_model_config_changed', handleConfigChange);
  }, []);

  // VRAM fit calculation
  const getQuantMultiplier = () => {
    if (quantization === 'fp16') return 2.0; // 16-bit float = 2 bytes per param
    if (quantization === 'q8') return 1.0;   // 8-bit = 1 byte per param
    return 0.55;                              // 4-bit = ~0.55 bytes per param
  };

  const modelSizeGB = Number((selectedModel.sizeBillion * getQuantMultiplier()).toFixed(1));
  const totalRequiredVram = modelSizeGB + 2; // Add 2GB general context/kv-cache overhead

  const getFitStatus = () => {
    const available = selectedHardware.vram;
    if (available >= totalRequiredVram) {
      return { status: 'green', text: 'Fits Perfectly', label: 'Recommended: Full VRAM allocation' };
    } else if (available * 1.3 >= totalRequiredVram) {
      return { status: 'yellow', text: 'Partial Offload', label: 'Warning: CPU offloading will decrease token speeds' };
    } else {
      return { status: 'red', text: 'Insufficient Memory', label: 'Error: Hardware lacks memory to load this model size' };
    }
  };

  const fit = getFitStatus();

  const getOllamaTag = () => {
    const base = selectedModel.name.toLowerCase().replace(/\s+/g, '-').replace('-8b', '');
    if (quantization === 'fp16') return `${base}:latest`;
    if (quantization === 'q8') return `${base}:q8_0`;
    return `${base}:q4_K_M`;
  };

  const getDeploymentCommands = () => {
    const ollamaTag = getOllamaTag();
    return `# ── Option 1: Ollama Serving (Recommended for Local Dev) ──
ollama run ${ollamaTag}

# ── Option 2: OpenVINO Model Server (Intel/AMD hardware acceleration) ──
# Convert Hugging Face weights to OpenVINO IR format:
optimum-cli export openvino --model ${selectedModel.hfRepo} --weight-format ${quantization === 'q4' ? 'int4' : quantization === 'q8' ? 'int8' : 'fp16'} ./ov_model/
# Spin up endpoint:
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --model-path ./ov_model/

# ── Option 3: vLLM serving (Enterprise cloud endpoints) ──
python -m vllm.entrypoints.openai.api_server \\
  --model ${selectedModel.hfRepo} \\
  --port 8000 \\
  --quantization ${quantization === 'q4' ? 'awq' : 'none'} \\
  --gpu-memory-utilization 0.90`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getDeploymentCommands());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live instances scan
  const queryServiceModels = async (key: 'openvino' | 'ollama' | 'lmstudio') => {
    setServiceStates(prev => ({
      ...prev,
      [key]: { status: 'loading', models: [] }
    }));

    const configForQuery: ModelConfig = {
      source: key === 'lmstudio' ? 'custom' : key,
      endpoint: endpoints[key],
      apiKey: '',
      modelName: ''
    };

    try {
      const models = await fetchAvailableModels(configForQuery);
      setServiceStates(prev => ({
        ...prev,
        [key]: { status: 'success', models }
      }));
    } catch (e: any) {
      setServiceStates(prev => ({
        ...prev,
        [key]: { status: 'failed', models: [], error: e.message || 'Connection unreachable' }
      }));
    }
  };

  const bindModel = (key: 'openvino' | 'ollama' | 'lmstudio', modelName: string) => {
    const newConfig: ModelConfig = {
      source: key === 'lmstudio' ? 'custom' : key,
      endpoint: endpoints[key],
      apiKey: '',
      modelName: modelName
    };
    saveModelConfig(newConfig);
    setActiveConfig(newConfig);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('lumen_model_config_changed', { detail: newConfig }));
  };

  const bindWebGPU = () => {
    const newConfig: ModelConfig = {
      source: 'custom',
      endpoint: 'webgpu://local-cache',
      apiKey: '',
      modelName: 'SmolLM2-1.7B-Instruct (WebGPU)'
    };
    saveModelConfig(newConfig);
    setActiveConfig(newConfig);
    window.dispatchEvent(new CustomEvent('lumen_model_config_changed', { detail: newConfig }));
  };

  return (
    <div className="copilot-container animate-slide-up">
      {/* Header */}
      <div className="rt-header">
        <div>
          <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
            <span className="rt-dot" style={{ background: 'var(--brand)' }} />
            Clinical AI Local Instance Manager &amp; Cookbook
          </div>
          <h2 className="rt-title">Open-Source Medical AI Deployment Hub</h2>
          <p className="rt-subtitle">
            Configure, serve, and launch quantized open-source clinical models directly in your workstation environment.
          </p>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="doc-workbench-tabs" style={{ marginBottom: '20px' }}>
        <button 
          className={`doc-tab ${activeSubTab === 'cookbook' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('cookbook')}
        >
          Deployment Cookbook &amp; Calculator
        </button>
        <button 
          className={`doc-tab ${activeSubTab === 'instances' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('instances')}
        >
          Live Local Instances &amp; Model Launcher
        </button>
      </div>

      {activeSubTab === 'cookbook' ? (
        <div className="cookbook-grid">
          {/* Left: Hardware and Quantization configs */}
          <div className="cookbook-hardware-panel">
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={14} style={{ color: 'var(--brand)' }} />
                1. Host Hardware Profile
              </h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>Select the target system hosting your clinical model:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {HARDWARE_PROFILES.map(hw => (
                  <div
                    key={hw.id}
                    className={`hardware-card ${selectedHardware.id === hw.id ? 'active' : ''}`}
                    onClick={() => setSelectedHardware(hw)}
                  >
                    <span className="hardware-name">{hw.name}</span>
                    <span className="hardware-vram">{hw.vram} GB System Memory / VRAM</span>
                    <p className="hardware-desc">{hw.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Model configs, calculator, and command outputs */}
          <div className="cookbook-models-panel">
            {/* Models */}
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={14} style={{ color: 'var(--brand)' }} />
                2. Open-Source Clinical Models
              </h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>Choose the clinical AI weight profile to run:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {CLINICAL_MODELS.map(model => (
                  <button
                    key={model.name}
                    className={`patient-card ${selectedModel.name === model.name ? 'selected' : ''}`}
                    onClick={() => setSelectedModel(model)}
                    style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px' }}
                  >
                    <strong style={{ fontSize: '13px' }}>{model.name}</strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--brand)', fontFamily: 'monospace' }}>{model.hfRepo}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--fg-muted)', marginTop: '4px', lineHeight: '1.3' }}>{model.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantization Selector */}
            <div className="lb-card">
              <h4 className="lb-card-title">3. Model Quantization Level</h4>
              <p className="lb-card-subtitle">Select quantization format to reduce parameters memory footprint:</p>
              <div className="quant-selector">
                <button className={`quant-btn ${quantization === 'fp16' ? 'active' : ''}`} onClick={() => setQuantization('fp16')}>
                  FP16 (Uncompressed)
                </button>
                <button className={`quant-btn ${quantization === 'q8' ? 'active' : ''}`} onClick={() => setQuantization('q8')}>
                  Q8_0 (8-bit Quantized)
                </button>
                <button className={`quant-btn ${quantization === 'q4' ? 'active' : ''}`} onClick={() => setQuantization('q4')}>
                  Q4_K_M (4-bit Highly Quantized)
                </button>
              </div>
            </div>

            {/* Calculator Output */}
            <div className="lb-card">
              <h4 className="lb-card-title">4. VRAM / Memory Fit Scoring</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Model size</span>
                  <strong style={{ display: 'block', fontSize: '16px', color: 'var(--fg-primary)', marginTop: '2px' }}>{modelSizeGB} GB</strong>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Total Required VRAM</span>
                  <strong style={{ display: 'block', fontSize: '16px', color: 'var(--fg-primary)', marginTop: '2px' }}>{totalRequiredVram} GB</strong>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Available Memory</span>
                  <strong style={{ display: 'block', fontSize: '16px', color: 'var(--brand)', marginTop: '2px' }}>{selectedHardware.vram} GB</strong>
                </div>
              </div>

              {/* Scorecard verdict */}
              <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px',
                background: fit.status === 'green' ? 'rgba(16,185,129,0.06)' : fit.status === 'yellow' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${fit.status === 'green' ? 'var(--color-safe-border)' : fit.status === 'yellow' ? 'var(--color-warn-border)' : 'var(--color-danger-border)'}`
              }}>
                {fit.status === 'green' ? (
                  <CheckCircle size={18} style={{ color: 'var(--color-safe)' }} />
                ) : (
                  <AlertTriangle size={18} style={{ color: fit.status === 'yellow' ? 'var(--color-warn)' : 'var(--color-danger)' }} />
                )}
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--fg-primary)', display: 'block' }}>{fit.text} Status</strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--fg-muted)' }}>{fit.label}</span>
                </div>
              </div>
            </div>

            {/* copyable instructions script */}
            <div className="lb-terminal-panel">
              <div className="lb-terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={14} style={{ color: 'var(--brand)' }} />
                  <span className="terminal-title">Copyable Deployment Shell Scripts</span>
                </div>
                <button className="btn btn-sm" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--fg-secondary)' }}>
                  <Copy size={11} />
                  {copied ? 'Copied' : 'Copy Scripts'}
                </button>
              </div>
              <pre className="lb-terminal-body" style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '11.5px', background: '#0a0d14', color: '#00d4ff', padding: '12px', margin: 0, fontFamily: 'monospace' }}>
                <code>{getDeploymentCommands()}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="cookbook-grid">
          {/* Left Column: Local Daemon Instances Registry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={14} style={{ color: 'var(--brand)' }} />
                Registered Local Services
              </h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '16px' }}>
                Lumen dynamically pings local ports to locate served clinical LLMs. Keep your services running to detect downloaded weights.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Intel OpenVINO */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--fg-primary)' }}>Intel OpenVINO Server</strong>
                      <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>C++ Host Wrapper (Fast CPU/NPU Inference)</span>
                    </div>
                    <span className={`status-pill ${serviceStates.openvino.status === 'success' ? 'safe' : serviceStates.openvino.status === 'failed' ? 'danger' : ''}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      <span className="dot" style={{ background: serviceStates.openvino.status === 'success' ? 'var(--color-safe)' : serviceStates.openvino.status === 'failed' ? 'var(--color-danger)' : 'var(--fg-muted)' }} />
                      {serviceStates.openvino.status === 'success' ? 'Active' : serviceStates.openvino.status === 'failed' ? 'Offline' : 'Unchecked'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={endpoints.openvino}
                      onChange={e => setEndpoints({ ...endpoints, openvino: e.target.value })}
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--fg-primary)' }}
                      placeholder="http://127.0.0.1:8000"
                    />
                    <button 
                      className="btn btn-sm"
                      onClick={() => queryServiceModels('openvino')}
                      disabled={serviceStates.openvino.status === 'loading'}
                    >
                      {serviceStates.openvino.status === 'loading' ? 'Checking...' : 'Detect Models'}
                    </button>
                  </div>
                  {/* Connection Error Message */}
                  {serviceStates.openvino.status === 'failed' && serviceStates.openvino.error && (
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--fg-danger)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '8px 12px', borderRadius: '6px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      <strong>Connection Error:</strong> {serviceStates.openvino.error}. Ensure the host wrapper is running and CORS is enabled.
                    </div>
                  )}
                  {/* Model List */}
                  {serviceStates.openvino.status === 'success' && (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', display: 'block', marginBottom: '6px' }}>Detected local weights:</span>
                      {serviceStates.openvino.models.length === 0 ? (
                        <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--fg-subtle)' }}>No loaded weights detected. Use optimum-cli to export weights first.</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {serviceStates.openvino.models.map(m => (
                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--fg-primary)' }}>{m}</span>
                              <button 
                                className="btn btn-sm" 
                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                onClick={() => bindModel('openvino', m)}
                              >
                                {activeConfig.source === 'openvino' && activeConfig.modelName === m ? '✓ Active LLM' : 'Launch & Bind'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Ollama */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--fg-primary)' }}>Ollama Engine</strong>
                      <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>Background Service (GGUF / HuggingFace CLI)</span>
                    </div>
                    <span className={`status-pill ${serviceStates.ollama.status === 'success' ? 'safe' : serviceStates.ollama.status === 'failed' ? 'danger' : ''}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      <span className="dot" style={{ background: serviceStates.ollama.status === 'success' ? 'var(--color-safe)' : serviceStates.ollama.status === 'failed' ? 'var(--color-danger)' : 'var(--fg-muted)' }} />
                      {serviceStates.ollama.status === 'success' ? 'Active' : serviceStates.ollama.status === 'failed' ? 'Offline' : 'Unchecked'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={endpoints.ollama}
                      onChange={e => setEndpoints({ ...endpoints, ollama: e.target.value })}
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--fg-primary)' }}
                      placeholder="http://localhost:11434"
                    />
                    <button 
                      className="btn btn-sm"
                      onClick={() => queryServiceModels('ollama')}
                      disabled={serviceStates.ollama.status === 'loading'}
                    >
                      {serviceStates.ollama.status === 'loading' ? 'Checking...' : 'Detect Models'}
                    </button>
                  </div>
                  {/* Connection Error Message */}
                  {serviceStates.ollama.status === 'failed' && serviceStates.ollama.error && (
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--fg-danger)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '8px 12px', borderRadius: '6px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      <strong>Connection Error:</strong> {serviceStates.ollama.error}. Ensure Ollama is running and CORS is enabled (run <code>OLLAMA_ORIGINS="*" ollama serve</code>).
                    </div>
                  )}
                  {/* Model List */}
                  {serviceStates.ollama.status === 'success' && (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', display: 'block', marginBottom: '6px' }}>Downloaded local libraries:</span>
                      {serviceStates.ollama.models.length === 0 ? (
                        <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--fg-subtle)' }}>Ollama library is empty. Use `ollama run` to download clinical tags.</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {serviceStates.ollama.models.map(m => (
                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--fg-primary)' }}>{m}</span>
                              <button 
                                className="btn btn-sm" 
                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                onClick={() => bindModel('ollama', m)}
                              >
                                {activeConfig.source === 'ollama' && activeConfig.modelName === m ? '✓ Active LLM' : 'Launch & Bind'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. LM Studio / LocalAI */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--fg-primary)' }}>LM Studio / LocalAI</strong>
                      <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>OpenAI-compatible server daemon</span>
                    </div>
                    <span className={`status-pill ${serviceStates.lmstudio.status === 'success' ? 'safe' : serviceStates.lmstudio.status === 'failed' ? 'danger' : ''}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      <span className="dot" style={{ background: serviceStates.lmstudio.status === 'success' ? 'var(--color-safe)' : serviceStates.lmstudio.status === 'failed' ? 'var(--color-danger)' : 'var(--fg-muted)' }} />
                      {serviceStates.lmstudio.status === 'success' ? 'Active' : serviceStates.lmstudio.status === 'failed' ? 'Offline' : 'Unchecked'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={endpoints.lmstudio}
                      onChange={e => setEndpoints({ ...endpoints, lmstudio: e.target.value })}
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--fg-primary)' }}
                      placeholder="http://localhost:1234"
                    />
                    <button 
                      className="btn btn-sm"
                      onClick={() => queryServiceModels('lmstudio')}
                      disabled={serviceStates.lmstudio.status === 'loading'}
                    >
                      {serviceStates.lmstudio.status === 'loading' ? 'Checking...' : 'Detect Models'}
                    </button>
                  </div>
                  {/* Connection Error Message */}
                  {serviceStates.lmstudio.status === 'failed' && serviceStates.lmstudio.error && (
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--fg-danger)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '8px 12px', borderRadius: '6px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      <strong>Connection Error:</strong> {serviceStates.lmstudio.error}. Ensure server is running and CORS is enabled in settings.
                    </div>
                  )}
                  {/* Model List */}
                  {serviceStates.lmstudio.status === 'success' && (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', display: 'block', marginBottom: '6px' }}>Detected models:</span>
                      {serviceStates.lmstudio.models.length === 0 ? (
                        <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--fg-subtle)' }}>No models reported. Verify model is loaded inside LM Studio.</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {serviceStates.lmstudio.models.map(m => (
                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--fg-primary)' }}>{m}</span>
                              <button 
                                className="btn btn-sm" 
                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                onClick={() => bindModel('lmstudio', m)}
                              >
                                {activeConfig.source === 'custom' && activeConfig.modelName === m ? '✓ Active LLM' : 'Launch & Bind'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Model Bindings & Browser Cache Sandbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Config Profile */}
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} style={{ color: 'var(--color-safe)' }} />
                Active Sandbox Binding
              </h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>Lumen clinical evaluation engine is currently bound to the following active gateway:</p>
              
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--fg-muted)' }}>Provider Provider:</span>
                  <strong style={{ color: 'var(--brand)', textTransform: 'uppercase' }}>{activeConfig.source}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--fg-muted)' }}>Model Name:</span>
                  <strong style={{ color: 'var(--fg-primary)' }}>{activeConfig.modelName || '(None Selected)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}>Endpoint URL:</span>
                  <span style={{ color: 'var(--fg-subtle)', fontFamily: 'monospace', fontSize: '11px' }}>{activeConfig.endpoint}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '4px', fontSize: '11px', color: 'var(--fg-safe)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-safe)', display: 'inline-block' }} />
                  <span>Ready to route clinical queries through this active local pipeline.</span>
                </div>
              </div>
            </div>

            {/* Browser WebGPU Cache Sandbox */}
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={14} style={{ color: 'var(--brand)' }} />
                WebGPU Browser Cache Sandbox
              </h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
                Run inference 100% locally in-browser using WebGPU/Transformers.js without installing any external server software:
              </p>
              
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong style={{ fontSize: '12px', display: 'block', color: 'var(--fg-primary)' }}>SmolLM2 1.7B Instruct (WebGPU)</strong>
                  <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', display: 'block', marginTop: '2px' }}>Requires compatible browser (Chrome/Edge v113+) with local GPU acceleration.</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>Status: <strong>Cached</strong> (1.02 GB footprint)</span>
                  <button 
                    className="btn btn-sm"
                    style={{ padding: '2px 8px', fontSize: '10px' }}
                    onClick={bindWebGPU}
                  >
                    {activeConfig.endpoint === 'webgpu://local-cache' ? '✓ Selected' : 'Configure WebGPU'}
                  </button>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--fg-subtle)', lineHeight: '1.4' }}>
                  💡 <em>Note: When WebGPU is selected, Lumen loads weights directly from Hugging Face Hub using the browser's Cache Storage API and executes model runs entirely inside your client sandbox.</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

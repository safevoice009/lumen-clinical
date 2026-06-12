import React, { useState } from 'react';
import { Cpu, Terminal, Layers, CheckCircle, AlertTriangle, Copy } from 'lucide-react';

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

export const ClinicalCookbook: React.FC = () => {
  const [selectedHardware, setSelectedHardware] = useState<HardwareProfile>(HARDWARE_PROFILES[3]);
  const [selectedModel, setSelectedModel] = useState<ClinicalModel>(CLINICAL_MODELS[0]);
  const [quantization, setQuantization] = useState<'fp16' | 'q8' | 'q4'>('q4');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="copilot-container animate-slide-up">
      {/* Header */}
      <div className="rt-header">
        <div>
          <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
            <span className="rt-dot" style={{ background: 'var(--brand)' }} />
            Clinical AI Cookbook Hub Active
          </div>
          <h2 className="rt-title">Open-Source Medical AI Deployment Hub</h2>
          <p className="rt-subtitle">
            A developer cookbook detailing quantization, VRAM memory metrics, and configuration scripts to serve medical LLMs locally.
          </p>
        </div>
      </div>

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
    </div>
  );
};

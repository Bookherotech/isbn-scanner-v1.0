import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ScanLine, Keyboard, Camera, CameraOff, X } from 'lucide-react';
import { isValidIsbn, normalizeIsbn } from '@/lib/isbn';

interface ScannerProps {
  onScan: (isbn: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [manualError, setManualError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        setCameras(devices);
        if (devices.length > 0) {
          const back = devices.find((d) => /back|rear|environment/i.test(d.label));
          setSelectedCamera((back || devices[0]).deviceId);
        }
      })
      .catch(() => {});
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setError('');
    if (!selectedCamera) {
      setError('No camera selected. Try manual entry.');
      return;
    }
    try {
      setScanning(true);
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const controls = await reader.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current!,
        (result) => {
          if (result) {
            const text = result.getText();
            const isbn = normalizeIsbn(text);
            if (isValidIsbn(isbn)) {
              stopCamera();
              onScan(isbn);
            }
          }
        }
      );
      controlsRef.current = controls;
    } catch (err: any) {
      setError('Could not access camera. Use manual entry instead.');
      setScanning(false);
    }
  }

  function stopCamera() {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setScanning(false);
  }

  function handleManualSubmit() {
    const isbn = normalizeIsbn(manualInput);
    if (!isbn) {
      setManualError('Please enter an ISBN.');
      return;
    }
    if (!isValidIsbn(isbn)) {
      setManualError('Invalid ISBN. Please check the number.');
      return;
    }
    setManualError('');
    setManualInput('');
    onScan(isbn);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              stopCamera();
              setMode('camera');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              mode === 'camera'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera size={20} />
            Camera Scan
          </button>
          <button
            onClick={() => {
              stopCamera();
              setMode('manual');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              mode === 'manual'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Keyboard size={20} />
            Manual Entry
          </button>
        </div>

        <div className="p-6">
          {mode === 'camera' ? (
            <div>
              <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {scanning ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                  />
                ) : (
                  <div className="text-gray-500 flex flex-col items-center gap-3">
                    <CameraOff size={48} />
                    <p className="text-sm">Camera is off</p>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-emerald-400 rounded-lg">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {cameras.length > 1 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${cam.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <X size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                {!scanning ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <ScanLine size={20} />
                    Start Scanning
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                    Stop
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter ISBN
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="e.g. 9781405963282"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
              />
              {manualError && (
                <p className="mt-2 text-sm text-red-600">{manualError}</p>
              )}
              <button
                onClick={handleManualSubmit}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <ScanLine size={20} />
                Look Up ISBN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

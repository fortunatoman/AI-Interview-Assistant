import { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle, AlertCircle, Info } from 'lucide-react';
import openaiService from '../services/openai';

interface OpenAIConfigProps {
    onConfigChange?: (configured: boolean) => void;
}

export default function OpenAIConfig({ onConfigChange }: OpenAIConfigProps) {
    const [apiKey, setApiKey] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);

    useEffect(() => {
        const configured = openaiService.isConfigured();
        setIsConfigured(configured);
        if (!configured) {
            setShowConfig(true);
        }
        onConfigChange?.(configured);
    }, [onConfigChange]);

    const handleSaveConfig = () => {
        if (apiKey.trim()) {
            setIsConfigured(true);
            setApiKey('');
            setShowConfig(false);
            onConfigChange?.(true);
        }
    };

    const testConnection = async () => {
        setTestingConnection(true);
        try {
            await openaiService.generateInterviewResponse('Test question: What is your name?');
            alert('✅ OpenAI connection successful!');
        } catch (error: any) {
            alert(`❌ Connection failed: ${error.message}`);
        } finally {
            setTestingConnection(false);
        }
    };

    const usageInfo = openaiService.getUsageInfo();

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary-600" />
                    OpenAI Configuration
                </h3>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                    {showConfig ? 'Hide' : 'Show'} Config
                </button>
            </div>

            {/* Status Indicator */}
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${isConfigured
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                {isConfigured ? (
                    <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">OpenAI Connected</span>
                        <span className="text-xs opacity-75">({usageInfo.model} • {usageInfo.source})</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">OpenAI Not Configured</span>
                    </>
                )}
            </div>

            {showConfig && (
                <div className="space-y-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-primary-700 dark:text-primary-300">
                                <p className="font-medium mb-1">If this plugin is not working, please try the following:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                                    <li>Enter your API key below and click "Save Configuration"</li>
                                    <li>Restart the plugin</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            OpenAI API Key
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="input-field pl-10"
                                />
                            </div>
                            <button
                                onClick={handleSaveConfig}
                                disabled={!apiKey.trim()}
                                className="btn-primary px-4 py-2 text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {isConfigured && (
                        <div className="flex gap-2">
                            <button
                                onClick={testConnection}
                                disabled={testingConnection}
                                className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                            >
                                {testingConnection ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-secondary-400 border-t-transparent rounded-full animate-spin"></div>
                                        Testing...
                                    </>
                                ) : (
                                    'Test Connection'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
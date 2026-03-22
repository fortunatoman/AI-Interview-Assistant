import { useState, useCallback } from 'react';
import { Sparkles, Loader2, Wand2, X } from 'lucide-react';
import openaiService from '../../services/openai';

interface JobDescriptionGeneratorProps {
    onJobDescriptionGenerated: (description: string) => void;
    onClose: () => void;
}

export default function JobDescriptionGenerator({
    onJobDescriptionGenerated,
    onClose
}: JobDescriptionGeneratorProps) {
    const [jobTitle, setJobTitle] = useState('');
    const [industry, setIndustry] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [keySkills, setKeySkills] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!jobTitle.trim()) {
            setError('Job title is required');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const skillsArray = keySkills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

            const description = await openaiService.generateJobDescription(
                jobTitle.trim(),
                industry.trim() || undefined,
                companyName.trim() || undefined,
                experienceLevel.trim() || undefined,
                skillsArray.length > 0 ? skillsArray : undefined
            );

            onJobDescriptionGenerated(description);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to generate job description');
        } finally {
            setIsGenerating(false);
        }
    }, [jobTitle, industry, companyName, experienceLevel, keySkills, onJobDescriptionGenerated, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isGenerating) {
            handleGenerate();
        }
    }, [handleGenerate, isGenerating]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-700 p-6 w-full max-h-[95vh] overflow-y-auto max-w-2xl mx-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">AI Job Description Generator</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Job Title */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Job Title *
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Senior Software Engineer"
                            className="input-field"
                        />
                    </div>

                    <div className="flex gap-4 flex-row justify-between">
                        {/* Industry */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                Industry
                            </label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g., Technology, Healthcare, Finance"
                                className="input-field"
                            />
                        </div>

                        {/* Company Name */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g., Google, Apple, Microsoft"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Experience Level
                        </label>
                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Select experience level</option>
                            <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                            <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                            <option value="Senior Level (6-10 years)">Senior Level (6-10 years)</option>
                            <option value="Lead/Manager (8+ years)">Lead/Manager (8+ years)</option>
                            <option value="Director/Executive (10+ years)">Director/Executive (10+ years)</option>
                        </select>
                    </div>

                    {/* Key Skills */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Key Skills (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={keySkills}
                            onChange={(e) => setKeySkills(e.target.value)}
                            placeholder="e.g., React, TypeScript, AWS, Agile"
                            className="input-field"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !jobTitle.trim()}
                            className="btn-primary flex items-center gap-2 px-4 py-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Job Description
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="btn-secondary px-4 py-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

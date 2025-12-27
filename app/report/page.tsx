'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { database } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { analyzeTicketWithAI } from '@/lib/gemini';
import { awardTicketReportKarma } from '@/lib/karma';
import imageCompression from 'browser-image-compression';
import dynamic from 'next/dynamic';
import { Upload, MapPin, FileText, Tag, Image as ImageIcon, Send, ChevronRight, ChevronLeft, Sparkles, Mic, MicOff, Globe, RefreshCw, Zap } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { getCachedAnalysis, findSimilarAnalysis, cacheAnalysis, clearAllCache, initializeCache } from '@/lib/aiCache';

// Dynamically import MapPicker with SSR disabled
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[300px] sm:h-[400px] glass rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    ),
});

const CATEGORIES = [
    'Electrical',
    'Water',
    'Cleanliness',
    'Infrastructure',
    'Safety',
    'Technology',
    'Other',
];

const LANGUAGES = [
    { code: 'en-IN', name: 'English', native: 'English' },
    { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
    { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
    { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
];

export default function ReportPage() {
    const { user, loading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Quota Shield - Caching & Debouncing
    const [isCheckingCache, setIsCheckingCache] = useState(false);
    const [cacheHit, setCacheHit] = useState(false);
    const [manualRefresh, setManualRefresh] = useState(false);
    const [aiPreview, setAiPreview] = useState<{
        category: string;
        urgency: number;
        summary: string;
    } | null>(null);
    const debouncedDescription = useDebounce(description, 1500); // 1.5s delay

    useEffect(() => {
        if (!user && !loading) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Initialize cache on mount
    useEffect(() => {
        initializeCache();
    }, []);

    // Debounced AI analysis with caching
    useEffect(() => {
        if (!debouncedDescription || debouncedDescription.trim().length < 10) {
            setAiPreview(null);
            setCacheHit(false);
            return;
        }

        // Skip if manual refresh is active
        if (manualRefresh) {
            setManualRefresh(false);
            return;
        }

        const checkCacheAndAnalyze = async () => {
            setIsCheckingCache(true);
            setCacheHit(false);

            // Check for exact match
            let cached = getCachedAnalysis(debouncedDescription);

            // If no exact match, try fuzzy matching
            if (!cached) {
                cached = findSimilarAnalysis(debouncedDescription);
            }

            if (cached) {
                // Cache hit! Use cached result
                setCacheHit(true);
                setAiPreview({
                    category: cached.category,
                    urgency: cached.urgency,
                    summary: cached.summary
                });
                setIsCheckingCache(false);
                showToast('⚡ Instant match found!', 'success');
            } else {
                // Cache miss - would call AI here in real implementation
                // For now, just clear the checking state
                setIsCheckingCache(false);
                setAiPreview(null);
            }
        };

        checkCacheAndAnalyze();
    }, [debouncedDescription, manualRefresh]);

    const startVoiceRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            showToast('Voice recognition not supported in this browser', 'error');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = selectedLanguage; // Use selected language
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
            const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.native || 'your language';
            showToast(`Listening in ${langName}... Speak now`, 'info');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setDescription((prev) => prev + (prev ? ' ' : '') + transcript);
            showToast('Voice recorded successfully', 'success');
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            showToast('Voice recording failed. Please try again.', 'error');
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            showToast('Failed to compress image. Please try again.', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!user || !title || !description || !category || !location) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        setAiAnalyzing(true);

        try {
            let imageBase64 = '';

            // Convert image to base64
            if (imageFile) {
                imageBase64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            }

            // AI Analysis
            showToast('AI is analyzing your issue...', 'info');
            const aiAnalysis = await analyzeTicketWithAI(description, imageBase64);
            setAiAnalyzing(false);

            // Cache the AI result for future use
            cacheAnalysis(
                description,
                aiAnalysis.category,
                aiAnalysis.urgency,
                aiAnalysis.summary
            );

            // Create ticket data with AI enrichment
            const ticketData = {
                userId: user.uid,
                userName: user.displayName || user.email || 'Anonymous',
                userEmail: user.email,
                title,
                description,
                category, // User-selected category
                location: {
                    lat: location.lat,
                    lng: location.lng,
                },
                imageBase64,
                status: 'open',
                priority: 'unassigned',
                timestamp: Date.now(),
                selectedLanguage, // Store user's language preference
                // AI-generated fields
                ai_category: aiAnalysis.category,
                ai_priority: aiAnalysis.urgency,
                ai_summary: aiAnalysis.summary,
                translated_text: aiAnalysis.translated_text || null,
                native_response: aiAnalysis.native_response || null,
                ai_fix_guide: null,
                processed: true,
                // Upvoting fields
                upvotes: 0,
                upvotedBy: [],
                // Status timeline history
                history: [
                    {
                        status: 'open',
                        timestamp: Date.now(),
                        message: 'Issue reported',
                        updatedBy: user.displayName || user.email || 'Student'
                    },
                    {
                        status: 'ai_analyzed',
                        timestamp: Date.now() + 1000, // 1 second after
                        message: `AI categorized as ${aiAnalysis.category} with priority ${aiAnalysis.urgency}/10`,
                        updatedBy: 'AI System'
                    }
                ]
            };

            // Save to Realtime Database
            const ticketsRef = dbRef(database, 'tickets');
            const newTicketRef = push(ticketsRef);
            await set(newTicketRef, ticketData);

            // Award karma for reporting ticket (+10 points)
            if (user.email) {
                await awardTicketReportKarma(user.email);
            }

            // Success
            showToast('Issue reported successfully! +10 Karma earned!', 'success');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error submitting ticket:', error);
            showToast('Failed to submit issue. Please try again.', 'error');
            setAiAnalyzing(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 gradient-indigo pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Report an Issue</h1>
                    <p className="text-zinc-400">Help us keep the campus in top shape</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8 space-x-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold smooth-transition ${step >= s
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-800 text-zinc-500'
                                    }`}
                            >
                                {s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-16 h-1 mx-2 smooth-transition ${step > s ? 'bg-indigo-500' : 'bg-zinc-800'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="glass rounded-3xl p-8 border border-white/10">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <FileText className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-2xl font-semibold text-white">Basic Information</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Preferred Language *
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 smooth-transition appearance-none"
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.native} ({lang.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Voice recording and AI will use this language
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Issue Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Broken light in Building A"
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 smooth-transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Detailed Description *
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the issue in detail..."
                                        rows={5}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 smooth-transition resize-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={startVoiceRecording}
                                        disabled={isRecording}
                                        className={`absolute bottom-3 right-3 p-2 rounded-lg smooth-transition ${isRecording
                                            ? 'bg-red-500/20 border-red-500/50 animate-pulse'
                                            : 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/30'
                                            } border`}
                                        title="Record voice (Hindi/Marathi supported)"
                                    >
                                        {isRecording ? (
                                            <MicOff className="w-5 h-5 text-red-400" />
                                        ) : (
                                            <Mic className="w-5 h-5 text-indigo-400" />
                                        )}
                                    </button>
                                </div>
                                {isRecording && (
                                    <p className="text-xs text-indigo-400 mt-1 animate-pulse">
                                        🎤 Listening in {LANGUAGES.find(l => l.code === selectedLanguage)?.native}...
                                    </p>
                                )}

                                {/* Quota Shield - Visual Feedback */}
                                <div className="mt-3 space-y-2">
                                    {/* Checking Cache Status */}
                                    {isCheckingCache && (
                                        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500" />
                                            <span className="text-sm text-indigo-300">Checking local records...</span>
                                        </div>
                                    )}

                                    {/* Cache Hit Badge */}
                                    {cacheHit && aiPreview && (
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                                                <Zap className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm font-medium text-emerald-300">⚡ Instant Match</span>
                                                <span className="text-xs text-emerald-400/70">(0.1s)</span>
                                            </div>

                                            {/* AI Preview */}
                                            <div className="glass-card rounded-lg p-3 space-y-1">
                                                <p className="text-xs text-zinc-400">AI Preview:</p>
                                                <p className="text-sm text-white"><span className="text-zinc-500">Category:</span> {aiPreview.category}</p>
                                                <p className="text-sm text-white"><span className="text-zinc-500">Priority:</span> {aiPreview.urgency}/10</p>
                                                <p className="text-sm text-zinc-300">{aiPreview.summary}</p>
                                            </div>

                                            {/* Manual Refresh Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setManualRefresh(true);
                                                    setCacheHit(false);
                                                    setAiPreview(null);
                                                    clearAllCache();
                                                    showToast('Cache cleared. Type to get fresh AI analysis.', 'info');
                                                }}
                                                className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 smooth-transition"
                                            >
                                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                                <span className="text-sm">Refresh AI Analysis</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Category *
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 smooth-transition appearance-none"
                                    >
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Image */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <MapPin className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-2xl font-semibold text-white">Location & Image</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Click on the map to mark location *
                                </label>
                                <MapPicker
                                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                                    initialLat={19.0726}
                                    initialLng={72.8978}
                                />
                                {location && (
                                    <p className="text-sm text-indigo-400 mt-2">
                                        Selected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Upload Image (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:border-indigo-500 smooth-transition cursor-pointer"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        <span>{imageFile ? imageFile.name : 'Choose an image'}</span>
                                    </label>
                                </div>
                                {imagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-xl border border-white/10"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Send className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-2xl font-semibold text-white">Review & Submit</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-900 rounded-xl">
                                    <p className="text-sm text-zinc-500 mb-1">Title</p>
                                    <p className="text-white font-medium">{title}</p>
                                </div>

                                <div className="p-4 bg-zinc-900 rounded-xl">
                                    <p className="text-sm text-zinc-500 mb-1">Description</p>
                                    <p className="text-white">{description}</p>
                                </div>

                                <div className="p-4 bg-zinc-900 rounded-xl">
                                    <p className="text-sm text-zinc-500 mb-1">Category</p>
                                    <p className="text-white font-medium">{category}</p>
                                </div>

                                <div className="p-4 bg-zinc-900 rounded-xl">
                                    <p className="text-sm text-zinc-500 mb-1">Location</p>
                                    <p className="text-white">
                                        {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Not set'}
                                    </p>
                                </div>

                                {imagePreview && (
                                    <div className="p-4 bg-zinc-900 rounded-xl">
                                        <p className="text-sm text-zinc-500 mb-2">Image</p>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-8 pt-6 border-t border-white/10">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl smooth-transition mobile-button touch-target ${step === 1
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 1 && (!title || !description || !category)) ||
                                    (step === 2 && !location)
                                }
                                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl smooth-transition mobile-button touch-target ${(step === 1 && (!title || !description || !category)) ||
                                    (step === 2 && !location)
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'indigo-glow text-white'
                                    }`}
                            >
                                <span>Next</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl indigo-glow text-white smooth-transition disabled:opacity-50 disabled:cursor-not-allowed mobile-button touch-target"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Submit Issue</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Processing Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="glass rounded-3xl p-8 text-center max-w-md">
                        <div className="relative mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                            {aiAnalyzing && (
                                <Sparkles className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {aiAnalyzing ? 'AI is Analyzing Your Issue...' : 'Submitting Your Report'}
                        </h3>
                        <p className="text-zinc-400">
                            {aiAnalyzing
                                ? 'Gemini AI is categorizing and prioritizing your complaint'
                                : 'Saving to database...'}
                        </p>
                        {aiAnalyzing && (
                            <div className="mt-4 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" style={{ width: '70%' }}></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

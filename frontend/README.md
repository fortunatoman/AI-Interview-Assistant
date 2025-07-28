# Interview Assistant AI 🎯

A real-time interview assistant that listens to questions and provides AI-powered responses with voice synthesis.

## 🚀 Features

- **Real-time Speech Recognition** - Listen to interview questions
- **AI-Powered Responses** - OpenAI integration for intelligent answers
- **Voice Synthesis** - Automatic text-to-speech for responses
- **Document Upload** - Support for resume and job description files
- **Context-Aware** - Personalized responses based on uploaded documents
- **Modern UI** - Beautiful, responsive interface with Tailwind CSS

## 🏗️ Architecture

### Custom Hooks

The application uses custom hooks for better performance and reusability:

#### `useFileUpload`
Handles file upload and text extraction from various file types:
- `.txt` - Plain text files
- `.doc/.docx` - Microsoft Word documents
- `.pdf` - PDF documents (manual text input recommended due to browser limitations)

```typescript
const { isUploading, error, uploadFile, clearError } = useFileUpload({
    onSuccess: (text) => console.log('File processed:', text),
    onError: (error) => console.error('Upload failed:', error)
});
```

#### `useClipboard`
Provides clipboard functionality:

```typescript
const { copyToClipboard } = useClipboard();
await copyToClipboard('Text to copy');
```

#### `useConversation`
Manages conversation state and session statistics:

```typescript
const { conversations, sessionStats, addQuestion, addResponse, clearHistory } = useConversation();
```

#### `useSpeechRecognition`
Handles speech recognition with question detection:

```typescript
const { isListening, isSupported, transcript, toggleListening } = useSpeechRecognition({
    onQuestionDetected: (question) => console.log('Question:', question)
});
```

### Reusable Components

#### `FileUpload`
A reusable file upload component with drag-and-drop support:

```typescript
<FileUpload
    title="Resume"
    description="Drop your resume here or click to upload"
    acceptedFileTypes={['.txt', '.doc', '.docx', '.pdf']}
    onFileUpload={handleResumeUpload}
    onClear={clearResume}
    currentFile={resumeFile}
    currentText={resumeText}
    colorScheme="blue"
/>
```

#### `TextArea`
A reusable text area component with edit/copy functionality:

```typescript
<TextArea
    title="Job Description"
    placeholder="Paste the job description here..."
    value={jobDescriptionText}
    onChange={handleJobDescriptionChange}
    onClear={clearJobDescription}
    showEdit={showJobDescriptionPaste}
    onToggleEdit={() => setShowJobDescriptionPaste(!showJobDescriptionPaste)}
    colorScheme="purple"
    rows={6}
/>
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── FileUpload.tsx
│   │   └── TextArea.tsx
│   ├── DocumentManager.tsx    # Document upload management
│   ├── InterviewDashboard.tsx # Main dashboard
│   ├── OpenAIConfig.tsx      # OpenAI configuration
│   ├── ResponseGenerator.tsx  # AI response generation
│   ├── SpeechRecognition.tsx # Speech recognition
│   ├── TextToSpeech.tsx      # Text-to-speech
│   └── ConversationHistory.tsx
├── hooks/                     # Custom hooks
│   ├── useFileUpload.ts
│   ├── useClipboard.ts
│   ├── useConversation.ts
│   └── useSpeechRecognition.ts
├── services/
│   └── openai.ts             # OpenAI service
└── types/
    └── speech.d.ts           # TypeScript declarations
```

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure OpenAI**
   Create a `.env.local` file:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

1. **Configure OpenAI** - Add your API key in the OpenAI Configuration section
2. **Upload Documents** - Add your resume and job description for personalized responses
3. **Start Listening** - Click the microphone button to begin speech recognition
4. **Ask Questions** - Speak interview questions naturally
5. **Get Responses** - AI generates and speaks responses automatically

## 🔧 Extending the Application

### Adding New File Types

1. Update `useFileUpload.ts`:
   ```typescript
   else if (fileName.endsWith('.your-extension')) {
       // Add your parsing logic
       return await parseYourFile(file);
   }
   ```

2. Update component props:
   ```typescript
   acceptedFileTypes={['.txt', '.doc', '.docx', '.pdf', '.your-extension']}
   ```

### Adding New Hooks

Create a new hook in `src/hooks/`:
```typescript
export const useYourHook = (options: YourOptions) => {
    // Your hook logic
    return { /* your return values */ };
};
```

### Adding New Components

Create reusable components in `src/components/ui/`:
```typescript
export const YourComponent: React.FC<YourProps> = ({ /* props */ }) => {
    // Your component logic
    return <div>Your component</div>;
};
```

## 🎨 Styling

The application uses Tailwind CSS with custom components and color schemes. Each component can be themed using the `colorScheme` prop:

- `blue` - For resume uploads
- `purple` - For job descriptions
- `orange` - For additional context
- `green` - For success states

## 🚀 Performance Optimizations

- **Custom Hooks** - Reduce re-renders with `useCallback` and `useMemo`
- **Component Composition** - Reusable components reduce code duplication
- **Lazy Loading** - Components load only when needed
- **Memoization** - Expensive operations are memoized
- **State Management** - Centralized state with custom hooks

## 🔮 Future Enhancements

- [ ] Add more file format support
- [ ] Implement conversation export
- [ ] Add voice customization
- [ ] Support for multiple languages
- [ ] Real-time collaboration features
- [ ] Advanced analytics and insights

## 📝 License

MIT License - feel free to use this project for your own interview preparation needs!

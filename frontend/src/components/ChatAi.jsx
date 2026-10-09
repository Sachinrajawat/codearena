import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Loader2 } from 'lucide-react';

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { 
            role: 'model', 
            content: `Hi! I'm your AI assistant. How can I help you with "${problem?.title || 'this problem'}"?` 
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm();
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const onSubmit = async (data) => {
        const userMessage = data.message.trim();
        if (!userMessage) return;

        // Add user message to UI immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        reset();
        setIsTyping(true);

        try {
            // Send the message AND the problem context to your backend
            const response = await axiosClient.post("/ai/chat", {
                message: userMessage,
                problemId: problem?._id,
                problemTitle: problem?.title,
                description: problem?.description,
                testCases: problem?.visibleTestCases,
                startCode: problem?.startCode
            });

            setMessages(prev => [...prev, { 
                role: 'model', 
                content: response.data.message || response.data.content || "I have no response." 
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                 content: error.response?.data?.message || "Sorry, I couldn't reach the AI assistant. Please try again." 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        // Added flex-1 here to force the container to stretch and push the input down
        <div className="flex flex-col flex-1 h-full bg-base-100 rounded-lg">
            
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className={`chat-bubble whitespace-pre-wrap ${msg.role === "user" ? "chat-bubble-primary" : "bg-base-300 text-base-content"}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="chat chat-start">
                        <div className="chat-bubble bg-base-300 text-base-content">
                            <span className="loading loading-dots loading-sm"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="p-4 bg-base-200 rounded-b-lg border-t border-base-300"
            >
                <div className="flex items-center gap-2">
                    <input 
                        type="text"
                        placeholder="Ask for a hint or explanation..." 
                        className="input input-bordered flex-1 bg-base-100" 
                        disabled={isTyping}
                        autoComplete="off"
                        {...register("message", { required: true, minLength: 1 })}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!isValid || isTyping}
                    >
                        {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;
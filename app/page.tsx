"use client";

import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface ChatHistoryItem {
  id: number;
  title: string;
}

export default function ChatPage() {
  const pfp = process.env.NEXT_PUBLIC_PFP;
  const {
    input,
    handleInputChange: originalHandleInputChange,
    handleSubmit,
    isLoading,
  } = useChat();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    originalHandleInputChange(e);
  };

  const [messages, setMessages] = useState<
    { id: number; role: string; content: string }[]
  >([]);

  const addMessage = (message: {
    id: number;
    role: string;
    content: string;
  }) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    { id: 1, title: "First Chat" },
    { id: 2, title: "Second Chat" },
  ]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    addMessage(userMessage);

    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.content || "No response from assistant.",
      };
      addMessage(assistantMessage);
    } catch (error) {
      console.error("Error fetching model response:", error);
      const errorMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        content: "Sorry, something went wrong.",
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }

    originalHandleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {showSidebar && (
        <aside
          className={`shadow-md border-r transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-64"
          } ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center p-4">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">Chat History</h2>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2"
              >
                {isCollapsed ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronLeft size={20} />
                )}
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-5rem)] px-2">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center p-3 rounded-md cursor-pointer ${
                  selectedChat === chat.id
                    ? darkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : darkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback>{chat.title.charAt(0)}</AvatarFallback>
                </Avatar>
                {!isCollapsed && <span className="truncate">{chat.title}</span>}
              </div>
            ))}
          </ScrollArea>
        </aside>
      )}

      <div className="flex-grow flex flex-col">
        <header
          className={`flex justify-between items-center px-6 py-4 shadow-md ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <div className="flex items-center space-x-3">
            {!showSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="p-2"
              >
                <ChevronRight size={20} />
              </Button>
            )}
            <h1 className="text-2xl font-semibold">CHATBGT</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Avatar className="w-10 h-10 cursor-pointer">
              <AvatarImage src={`${pfp}`} alt="Profile" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex-grow flex flex-col items-center p-6">
          <Card
            className={`w-full max-w-3xl shadow-lg ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-4 flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-end ${
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {m.role === "user" ? "U" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`mx-2 rounded-xl px-4 py-2 ${
                          m.role === "user"
                            ? darkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-black"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start items-center">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="mx-2 rounded-xl px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-300">
                      <span className="dot-flashing" />
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form onSubmit={onSubmit} className="flex w-full space-x-3">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-grow rounded-full dark:bg-gray-700 dark:text-gray-300"
                />
                <Button
                  type="submit"
                  disabled={isLoading || isTyping}
                  className="flex-shrink-0 px-4"
                >
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

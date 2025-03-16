// ChatPage.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Flex,
  Box,
  VStack,
  Spinner,
  Card,
  CardBody,
  CardFooter,
  useColorModeValue,
  Text,
  useToast,
} from "@chakra-ui/react";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ui/ChatHeader";
import ChatMessage from "@/components/ui/ChatMessage";
import ChatInput from "@/components/ui/ChatInput";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

const STORAGE_KEY = "chat_history_v1";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial chat load
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const ollamaEndpoint = "http://localhost:11434/api/generate";
  const modelName = "qwen2.5:3b";

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  // Scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chats from local storage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats) as Chat[];
        setChats(parsedChats);
        if (!activeChat && parsedChats.length > 0) {
          const mostRecent = parsedChats.sort(
            (a, b) => b.lastUpdated - a.lastUpdated
          )[0];
          setActiveChat(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (error) {
        console.error("Error parsing saved chats:", error);
        toast({
          title: "Error",
          description: "Failed to load saved chats.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false); // Set loading to false after initial load
      }
    } else {
      setIsLoading(false); // Set loading to false if no saved chats
    }
  }, [activeChat, toast]);

  // Save chats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats) as Chat[];
        setChats(parsedChats); // Set chats
        if (!activeChat && parsedChats.length > 0) {
          const mostRecent = parsedChats.sort(
            (a, b) => b.lastUpdated - a.lastUpdated
          )[0];
          setActiveChat(mostRecent.id); // Set active chat
          setMessages(mostRecent.messages); // Load messages
        }
      } catch (error) {
        console.error("Error parsing saved chats:", error);
        toast({
          title: "Error",
          description: "Failed to load saved chats.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false); // Set loading to false after initial load
      }
    } else {
      setIsLoading(false); // Set loading to false if no saved chats
    }
  }, [activeChat, toast]);
  // Add a new message to the chat
  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  // Fetch response from Ollama API
  const fetchOllamaResponse = async (prompt: string) => {
    const response = await fetch(ollamaEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName, prompt, stream: true }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read response stream");

    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const jsonChunks = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const jsonChunk of jsonChunks) {
        try {
          const parsedChunk = JSON.parse(jsonChunk);
          if (parsedChunk.response) {
            fullResponse += parsedChunk.response;
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: fullResponse,
              };
              return updatedMessages;
            });
          }
        } catch (error) {
          console.error("Error parsing JSON chunk:", error);
        }
      }
    }
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!activeChat) {
      startNewChat();
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    setInput("");
    setIsTyping(true);

    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    addMessage(assistantMessage);

    try {
      await fetchOllamaResponse(input);
    } catch (error) {
      console.error("Ollama API error:", error);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = {
          ...assistantMessage,
          content: "Error: Unable to generate response.",
        };
        return updatedMessages;
      });
      toast({
        title: "Error",
        description: "Failed to generate response.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTyping(false);
      saveCurrentChat();
    }
  };

  const startNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Conversation ${chats.length + 1}`,
      messages: [],
      lastUpdated: Date.now(),
    };
    setChats((prevChats) => [...prevChats, newChat]); // Update chats
    setActiveChat(newChat.id); // Set active chat
    setMessages([]); // Clear messages
  }, [chats]);

  // Delete a chat
  const deleteChat = useCallback(
    (id: string) => {
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== id)); // Update chats
      if (activeChat === id) {
        setActiveChat(null); // Clear active chat
        setMessages([]); // Clear messages
      }
    },
    [activeChat]
  );

  // Load a chat
  const loadChat = useCallback(
    (id: string) => {
      const chat = chats.find((chat) => chat.id === id);
      if (chat) {
        setActiveChat(chat.id); // Set active chat
        setMessages(chat.messages); // Load messages
      }
    },
    [chats]
  );

  // Save the current chat
  const saveCurrentChat = useCallback(() => {
    if (activeChat) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages, lastUpdated: Date.now() } // Update chat
            : chat
        )
      );
    }
  }, [activeChat, messages]);
  return (
    <Flex minH="100vh" bg={bgColor}>
      <Sidebar
        chats={chats} // Ensure this is passed correctly
        activeChat={activeChat}
        startNewChat={startNewChat}
        loadChat={loadChat}
        deleteChat={deleteChat}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      <Flex flex="1" direction="column">
        <ChatHeader
          title={
            activeChat
              ? chats.find((c) => c.id === activeChat)?.title || "Chat"
              : "New Chat"
          }
        />

        <Flex flex="1" overflow="hidden">
          <Card w="100%" mx="auto" bg={cardBg}>
            <CardBody overflowY="auto" maxH="calc(100vh - 200px)">
              {isLoading ? (
                <Flex justify="center" align="center" h="100%">
                  <Spinner size="lg" />
                </Flex>
              ) : (
                <VStack align="stretch" spacing={4}>
                  {messages.map((m) => (
                    <ChatMessage key={m.id} role={m.role} content={m.content} />
                  ))}
                  
                  <div ref={messagesEndRef} />
                </VStack>
              )}
            </CardBody>
            <CardFooter>
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={onSubmit}
                isTyping={isTyping}
              />
            </CardFooter>
          </Card>
        </Flex>
      </Flex>
    </Flex>
  );
}

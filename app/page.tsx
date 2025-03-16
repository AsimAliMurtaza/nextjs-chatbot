"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Input,
  Button,
  Avatar,
  Text,
  IconButton,
  useColorMode,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import { Moon, Sun, Plus, Trash2, GripVertical } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // Added timestamp for better sorting/tracking
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number; // Added to sort chats by recency
}

const STORAGE_KEY = "chat_history_v1"; // Version the storage key for future migrations

export default function ChatPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ollamaEndpoint = "http://localhost:11434/api/generate";
  const modelName = "qwen2.5:3b";

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "white");
  const sidebarBg = useColorModeValue("gray.100", "gray.700");

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats from local storage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      
      // Load most recent chat if none is active
      if (!activeChat && parsedChats.length > 0) {
        const mostRecent = parsedChats.sort((a: Chat, b: Chat) => b.lastUpdated - a.lastUpdated)[0];
        setActiveChat(mostRecent.id);
        setMessages(mostRecent.messages);
      }
    }
  }, []);

  // Save chats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Create a new chat if none is active
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
      const response = await fetch(ollamaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName, prompt: input, stream: true }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to read response stream");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const jsonChunks = chunk
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const jsonChunk of jsonChunks) {
          try {
            const parsedChunk = JSON.parse(jsonChunk);
            if (parsedChunk.response) {
              fullResponse += parsedChunk.response;
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = {
                  ...assistantMessage,
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
    } finally {
      setIsTyping(false);
      saveCurrentChat();
    }
  };

  const startNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Conversation ${chats.length + 1}`,
      messages: [],
      lastUpdated: Date.now(),
    };
    setChats((prevChats) => [...prevChats, newChat]);
    setActiveChat(newChat.id);
    setMessages([]);
  };

  const deleteChat = (id: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
    if (activeChat === id) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const loadChat = (id: string) => {
    const chat = chats.find((chat) => chat.id === id);
    if (chat) {
      setActiveChat(chat.id);
      setMessages(chat.messages);
    }
  };

  const saveCurrentChat = () => {
    if (activeChat) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages, lastUpdated: Date.now() }
            : chat
        )
      );
    }
  };

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarRef.current) {
        const minWidth = 200;
        const maxWidth = window.innerWidth * 0.4;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };

    const handleMouseDown = () => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    };

    const resizeHandle = sidebarRef.current?.querySelector(".resize-handle");
    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", handleMouseDown);
      }
    };
  }, []);

  // Sort chats by last updated
  const sortedChats = [...chats].sort((a, b) => b.lastUpdated - a.lastUpdated);

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Sidebar */}
      <Box
        ref={sidebarRef}
        w={`${sidebarWidth}px`}
        borderRight="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.600")}
        bg={sidebarBg}
        p={4}
        position="relative"
        overflowY="auto"
      >
        <Box
          className="resize-handle"
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          w="4px"
          bg={useColorModeValue("gray.300", "gray.600")}
          cursor="col-resize"
          _hover={{ bg: useColorModeValue("gray.400", "gray.500") }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={GripVertical} color="gray.500" />
        </Box>
        <VStack align="stretch" spacing={4}>
          <Button
            leftIcon={<Plus size={16} />}
            colorScheme="blue"
            onClick={startNewChat}
          >
            New Chat
          </Button>
          <Divider />
          <Text fontSize="lg" fontWeight="bold">
            Chat History
          </Text>
          <VStack align="stretch" spacing={2}>
            {sortedChats.map((chat) => (
              <HStack
                key={chat.id}
                justify="space-between"
                bg={activeChat === chat.id ? useColorModeValue("gray.200", "gray.600") : "transparent"}
                borderRadius="md"
                p={1}
              >
                <Tooltip label={chat.title}>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    flex="1"
                    onClick={() => loadChat(chat.id)}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {chat.title}
                  </Button>
                </Tooltip>
                <IconButton
                  aria-label="Delete chat"
                  icon={<Trash2 size={16} />}
                  variant="ghost"
                  onClick={() => deleteChat(chat.id)}
                  _hover={{ bg: "red.200", color: "red.500" }}
                />
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Box>

      {/* Main Content */}
      <Flex flex="1" direction="column">
        {/* Header */}
        <Box
          p={4}
          borderBottom="1px solid"
          borderColor={useColorModeValue("gray.200", "gray.600")}
          bg={cardBg}
        >
          <Flex justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold">
              {activeChat
                ? chats.find((c) => c.id === activeChat)?.title || "Chat"
                : "New Chat"}
            </Text>
            <HStack spacing={4}>
              <IconButton
                aria-label="Toggle Dark Mode"
                icon={colorMode === "light" ? <Moon /> : <Sun />}
                onClick={toggleColorMode}
                variant="ghost"
              />
              <Avatar size="sm" />
            </HStack>
          </Flex>
        </Box>

        {/* Chat Area */}
        <Flex flex="1" overflow="hidden">
          <Card w="100%" mx="auto" bg={cardBg}>
            <CardBody overflowY="auto" maxH="calc(100vh - 200px)">
              <VStack align="stretch" spacing={4}>
                {messages.map((m) => (
                  <Flex
                    key={m.id}
                    direction={m.role === "user" ? "row-reverse" : "row"}
                    align="flex-end"
                  >
                    <Avatar
                      size="sm"
                      name={m.role === "user" ? "User" : "AI"}
                      mr={2}
                    />
                    <Box
                      p={3}
                      borderRadius="2xl"
                      bg={
                        m.role === "user"
                          ? "blue.500"
                          : useColorModeValue("gray.200", "gray.700")
                      }
                      color={m.role === "user" ? "white" : textColor}
                      maxW="70%"
                    >
                      <Text>{m.content}</Text>
                    </Box>
                  </Flex>
                ))}
                {isTyping && (
                  <Flex align="center">
                    <Spinner size="sm" mr={2} />
                    <Text>AI is typing...</Text>
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </CardBody>
            <CardFooter>
              <form onSubmit={onSubmit} style={{ width: "100%" }}>
                <Flex gap={2}>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    flex="1"
                  />
                  <Button
                    type="submit"
                    colorScheme="blue"
                    px={6}
                    isDisabled={isTyping}
                  >
                    Send
                  </Button>
                </Flex>
              </form>
            </CardFooter>
          </Card>
        </Flex>
      </Flex>
    </Flex>
  );
}
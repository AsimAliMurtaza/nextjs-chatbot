"use client";

import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { Moon, Sun, Plus } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const ollamaEndpoint = "http://localhost:11434/api/generate";
  const modelName = "qwen2.5:3b";

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "white");
  const sidebarBg = useColorModeValue("gray.100", "gray.700");

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };
    addMessage(userMessage);
    setInput("");
    setIsTyping(true);

    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
    };
    setMessages((prevMessages) => [...prevMessages, assistantMessage]);

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

        // Decode the chunk and split it into individual JSON objects
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
    }
  };
  const startNewChat = () => {
    setMessages([]);
    setActiveChat(null);
  };

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Sidebar */}
      <Box
        w="300px"
        borderRight="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.600")}
        bg={sidebarBg}
        p={4}
      >
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
            {chatHistory.map((chat, index) => (
              <Button
                key={index}
                variant="ghost"
                justifyContent="flex-start"
                onClick={() => setActiveChat(chat)}
              >
                {chat}
              </Button>
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
              Chat
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
            <CardBody overflowY="auto" maxH="60vh">
              <VStack align="stretch" spacing={4}>
                {messages.map((m) => (
                  <Flex
                    key={m.id}
                    direction={m.role === "user" ? "row-reverse" : "row"}
                    align="flex-end"
                  >
                    <Avatar
                      size="sm"
                      name={m.role === "user" ? "user" : "AI"}
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
                  <Button type="submit" colorScheme="blue" px={6}>
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

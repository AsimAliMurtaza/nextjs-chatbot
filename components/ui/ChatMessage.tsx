// components/ChatMessage.tsx
"use client";

import { Flex, Avatar, Box, Text, useColorModeValue } from "@chakra-ui/react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const userBg = useColorModeValue("blue.500", "blue.600");
  const assistantBg = useColorModeValue("gray.200", "gray.700");
  const userTextColor = "white";
  const assistantTextColor = useColorModeValue("gray.900", "white");
  const avatarBg = useColorModeValue("gray.300", "gray.600");

  return (
    <Flex
      direction={role === "user" ? "row-reverse" : "row"}
      align="flex-start" // Align to the top for better consistency
      mb={4} // Add some margin bottom for spacing between messages
    >
      <Avatar
        size="sm"
        name={role === "user" ? "User" : "AI"}
        mr={2}
        bg={avatarBg} // Set avatar background color
        borderRadius="full" // Rounded avatar
      />
      <Box
        p={3}
        borderRadius="2xl"
        bg={role === "user" ? userBg : assistantBg}
        color={role === "user" ? userTextColor : assistantTextColor}
        maxW="70%"
        boxShadow="sm" // Add a subtle shadow for depth
        transition="background-color 0.3s ease" // Smooth transition for background
      >
        <Text fontSize="sm">{content}</Text>
      </Box>
    </Flex>
  );
}

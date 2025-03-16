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
      alignItems="flex-start" // Align items to the top
      mb={4}
    >
      <Flex
        alignItems="center" // Vertically center the avatar
        mr={role === "user" ? 0 : 2} // Add right margin for assistant avatar
        ml={role === "user" ? 2 : 0} // Add left margin for user avatar
      >
        <Avatar
          size="sm"
          name={role === "user" ? "User" : "AI"}
          bg={avatarBg}
          borderRadius="full"
        />
      </Flex>
      <Box
        p={3}
        borderRadius="2xl"
        bg={role === "user" ? userBg : assistantBg}
        color={role === "user" ? userTextColor : assistantTextColor}
        maxW="70%"
        boxShadow="sm"
        transition="background-color 0.3s ease"
      >
        <Text fontSize="sm">{content}</Text>
      </Box>
    </Flex>
  );
}
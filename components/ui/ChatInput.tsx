// components/ChatInput.tsx
"use client";

import { Flex, Input, Button, useColorModeValue } from "@chakra-ui/react";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isTyping: boolean;
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isTyping,
}: ChatInputProps) {
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorder = useColorModeValue("gray.300", "gray.600");
  const buttonBg = useColorModeValue("blue.500", "blue.600");
  const buttonHoverBg = useColorModeValue("blue.600", "blue.700");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <form onSubmit={onSubmit} style={{ width: "100%" }}>
      <Flex gap={2}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          flex="1"
          bg={inputBg}
          border="1px solid"
          borderColor={inputBorder}
          borderRadius="xl" // Rounded input
          _focus={{ borderColor: "blue.500", boxShadow: "outline" }}
          color={textColor}
        />
        <Button
          type="submit"
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          px={6}
          isDisabled={isTyping}
          borderRadius="xl" // Rounded button
          leftIcon={<Send size={16} />} // Send icon
          color="white"
        >
          Send
        </Button>
      </Flex>
    </form>
  );
}
// components/ChatHeader.tsx
"use client";

import {
  Box,
  Flex,
  Text,
  IconButton,
  HStack,
  Avatar,
  useColorModeValue,
} from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import { useColorMode } from "@chakra-ui/react";

interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("gray.100", "gray.800"); // Slightly elevated background
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const iconButtonHoverBg = useColorModeValue("gray.200", "gray.700"); // Subtler hover
  const shadow = useColorModeValue("sm", "md"); // Subtle shadow for depth

  return (
    <Box
      p={4}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow={shadow} // Adding subtle shadow
      borderRadius="xl" // Rounded corners for Material You feel
    >
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="semibold" color={textColor}>
          {title}
        </Text>
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle Dark Mode"
            icon={colorMode === "light" ? <Moon /> : <Sun />}
            onClick={toggleColorMode}
            variant="ghost"
            _hover={{ bg: iconButtonHoverBg }}
            borderRadius="full" // Rounded IconButton
          />
          <Avatar size="sm" borderRadius="full" /> // Rounded Avatar
        </HStack>
      </Flex>
    </Box>
  );
}
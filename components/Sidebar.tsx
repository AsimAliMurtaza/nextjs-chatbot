// Sidebar.tsx
"use client";

import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Divider,
  IconButton,
  useColorModeValue,
  Tooltip,
  Collapse,
  Heading,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Chat {
  id: string;
  title: string;
  messages: any[];
  lastUpdated: number;
}

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  startNewChat: () => void;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

export default function Sidebar({
  chats,
  activeChat,
  startNewChat,
  loadChat,
  deleteChat,
  sidebarWidth,
  setSidebarWidth,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarBg = useColorModeValue("gray.100", "gray.700");
  const activeChatBg = useColorModeValue("gray.200", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const buttonBg = useColorModeValue("blue.500", "blue.600");
  const buttonHoverBg = useColorModeValue("blue.600", "blue.700");
  const deleteHoverBg = useColorModeValue("red.200", "red.600");
  const deleteHoverColor = useColorModeValue("red.500", "red.200");

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setSidebarWidth(isCollapsed ? 300 : 80); // Adjust widths as needed
  };

  return (
    <Box
      w={`${sidebarWidth}px`}
      borderRight="1px solid"
      borderColor={borderColor}
      bg={sidebarBg}
      p={isCollapsed ? 2 : 4} // Reduce padding when collapsed
      position="relative"
      borderRightRadius="xl"
      boxShadow="md"
      transition="width 0.3s ease, padding 0.3s ease" // Smooth transitions
    >
      {/* Collapse/Expand Button */}
      <IconButton
        aria-label="Toggle Sidebar"
        icon={isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        position="absolute"
        top="4"
        right={isCollapsed ? "18px" : "8px"} // Adjust position based on collapse state
        onClick={toggleCollapse}
        borderRadius="full"
        boxShadow="md"
        zIndex={1} // Ensure it's above other elements
      />

      {/* Expanded Sidebar Content */}
      <Collapse in={!isCollapsed} animateOpacity>
        <VStack align="stretch" spacing={4}>
          <Heading size="lg">ChatBot</Heading>
          <Divider mt={4} borderColor={borderColor} />
          <Text fontSize="lg" fontWeight="semibold" color={textColor}>
            History
          </Text>
          <VStack align="stretch" spacing={2} overflowY="auto" maxH="70vh">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <HStack
                  key={chat.id}
                  justify="space-between"
                  bg={activeChat === chat.id ? activeChatBg : "transparent"}
                  borderRadius="20px"
                  p={1}
                  _hover={{
                    bg:
                      activeChat === chat.id
                        ? activeChatBg
                        : useColorModeValue("gray.150", "gray.650"),
                  }}
                  transition="background-color 0.2s"
                >
                  <Tooltip label={chat.title}>
                    <Button
                      variant="unstyled"
                      ml={-12}
                      justifyContent="flex-start"
                      flex="1"
                      onClick={() => loadChat(chat.id)}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      color={textColor}
                    >
                      {chat.title}
                    </Button>
                  </Tooltip>
                  <IconButton
                    aria-label="Delete chat"
                    icon={<Trash2 size={16} />}
                    variant="ghost"
                    onClick={() => deleteChat(chat.id)}
                    _hover={{ bg: deleteHoverBg, color: deleteHoverColor }}
                    borderRadius="full"
                  />
                </HStack>
              ))
            ) : (
              <Text color={textColor} textAlign="center">
                No chats available.
              </Text>
            )}
          </VStack>
          <Button
            leftIcon={<Plus size={16} />}
            bg={buttonBg}
            color="white"
            _hover={{ bg: buttonHoverBg }}
            onClick={startNewChat}
            borderRadius="xl"
          >
            New Chat
          </Button>
        </VStack>
      </Collapse>

      {/* Collapsed Sidebar Content */}
      <Collapse in={isCollapsed} animateOpacity>
        <VStack align="center" spacing={4}>
          <IconButton
            mt={20}
            aria-label="New Chat"
            icon={<Plus size={16} />}
            bg={buttonBg}
            color="white"
            _hover={{ bg: buttonHoverBg }}
            onClick={startNewChat}
            borderRadius="full"
            p={2}
          />
          {chats.length > 0 ? (
            chats.map((chat) => (
              <Tooltip key={chat.id} label={chat.title}>
                <IconButton
                  aria-label={chat.title}
                  icon={<Text fontSize="xs">{chat.title.charAt(0)}</Text>}
                  bg={
                    activeChat === chat.id
                      ? activeChatBg
                      : useColorModeValue("gray.200", "gray.700")
                  }
                  color={textColor}
                  borderRadius="full"
                  size="sm"
                  onClick={() => loadChat(chat.id)}
                  _hover={{
                    bg:
                      activeChat === chat.id
                        ? activeChatBg
                        : useColorModeValue("gray.300", "gray.600"),
                  }}
                />
              </Tooltip>
            ))
          ) : (
            <Text color={textColor} textAlign="center">
              No chats available.
            </Text>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
}

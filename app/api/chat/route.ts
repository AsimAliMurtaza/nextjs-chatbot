import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/ChatModel";

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const modelLink = process.env.HUGGING_FACE_MODEL_LINK;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, conversationId, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request. 'messages' must be an array." },
        { status: 400 }
      );
    }
    const userMessage = messages[messages.length - 1].content;

    const response = await fetch(`${modelLink}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: messages.map((msg: any) => msg.content).join(" "),
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    const assistantMessage =
      Array.isArray(result) && result[0]?.generated_text
        ? result[0].generated_text
        : "No response from model.";

    const chat = await Chat.findOneAndUpdate(
      { _id: conversationId },
      {
        $push: {
          messages: [
            { sender: "user", content: userMessage, timestamp: new Date() },
            {
              sender: "assistant",
              content: assistantMessage,
              timestamp: new Date(),
            },
          ],
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(
      { content: assistantMessage, conversationId: chat._id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during chat completion:", error);

    if (error.code === "invalid_request_error" && error.status === 402) {
      return NextResponse.json(
        {
          error:
            "Insufficient Balance. Please recharge your Hugging Face account.",
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

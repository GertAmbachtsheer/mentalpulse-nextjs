"use client";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";

export default function Home() {
  
  return (
    <div className="flex flex-col h-screen w-1/3 mx-auto">
      <Authenticated>
        <nav className="flex w-full justify-between">
          <h1 className="text-2xl font-bold">Mental Pulse</h1>
          <CustomUserButton />
        </nav>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <AuthToggle />
      </Unauthenticated>
    </div>
  );
}

function Content() {
  const tasks = useQuery(api.tasks.get);
  return (
    <div>Authenticated content: 
      {tasks && tasks.length > 0 ? (
        tasks.map(({ _id, text }) => <div key={_id}>{text}</div>)
      ) : (
        <div>No tasks found</div>
      )}
    </div>
  );
}
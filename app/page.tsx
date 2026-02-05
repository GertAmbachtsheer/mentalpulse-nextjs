"use client";
import { Authenticated, Unauthenticated } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import AuthToggle from "@/components/AuthToggle";

export default function Home() {
  
  return (
    <>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <AuthToggle />
      </Unauthenticated>
    </>
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
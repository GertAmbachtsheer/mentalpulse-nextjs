"use client";
import React, { useEffect, useState } from "react";

type VOTD = {
  text: string;
  reference: string;
  url: string;
};

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export default function VerseOfTheDay() {
  const [votd, setVotd] = useState<VOTD | null>(null);

  useEffect(() => {
    fetch("/api/votd")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setVotd(data);
      })
      .catch(() => {});
  }, []);

  const getBibleLink = (): string => {
    if (!votd) return "#";
    if (isIOS()) {
      // iOS: use universal link — opens YouVersion app if installed, Safari otherwise
      return votd.url;
    }
    // Android: use deep link scheme
    const passageId = votd.url.split("/").pop() ?? "";
    return `bible://verse?id=${passageId}`;
  };

  const Wrapper = votd
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={getBibleLink()} target="_blank" rel="noopener noreferrer" className="block">
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20 active:opacity-80 transition-opacity cursor-pointer">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl"></div>
      <span className="mb-3 block text-white/80 text-xs font-semibold tracking-wider uppercase">
        Verse of the Day
      </span>
      {votd ? (
        <>
          <p className="mb-4 text-xl font-medium leading-relaxed text-white">
            &ldquo;{votd.text}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-white/40"></span>
            <span className="text-sm font-light text-white/90">{votd.reference}</span>
          </div>
        </>
      ) : (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-white/20"></div>
          <div className="h-4 w-full rounded bg-white/20"></div>
          <div className="h-4 w-2/3 rounded bg-white/20"></div>
          <div className="mt-4 h-3 w-24 rounded bg-white/20"></div>
        </div>
      )}
    </div>
    </Wrapper>
  );
}

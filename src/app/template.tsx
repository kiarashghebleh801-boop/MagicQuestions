"use client";
import React from "react";
import ThemeToggle from "../components/ThemeToggle";
export default function Template(props: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, React.createElement(ThemeToggle), props.children);
}

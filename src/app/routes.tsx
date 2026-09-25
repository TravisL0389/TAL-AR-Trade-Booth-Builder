import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { Builder } from "./components/Builder";
import { AIGenerator } from "./components/AIGenerator";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "builder/:templateId", Component: Builder },
      { path: "ai", Component: AIGenerator },
    ],
  },
]);

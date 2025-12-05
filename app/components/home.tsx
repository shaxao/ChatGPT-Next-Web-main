"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { useChatStore } from "../store";
import { getCSSVar, useMobileScreen } from "../utils";
import { Chat } from "./chat";

import dynamic from "next/dynamic";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const SideBar = dynamic(async () => (await import("./sidebar")).SideBar, {
  loading: () => <Loading noLogo />,
});

const VideoStudio = dynamic(async () => (await import("./video")).default, {
  loading: () => <Loading noLogo />,
});

const Gallery = dynamic(async () => (await import("./gallery")).default, {
  loading: () => <Loading noLogo />,
});
const GalleryDetail = dynamic(
  async () => (await import("./gallery-detail")).default,
  {
    loading: () => <Loading noLogo />,
  },
);

export function useSwitchTheme() {
  const config = useChatStore((state) => state.config);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.remove("light");
    html.classList.remove("dark");
    body.classList.remove("light");
    body.classList.remove("dark");

    if (config.theme === "dark") {
      html.classList.add("dark");
      body.classList.add("dark");
    } else if (config.theme === "light") {
      html.classList.add("light");
      body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

function WideScreen() {
  const config = useChatStore((state) => state.config);

  return (
    <div
      className={`${
        config.tightBorder ? styles["tight-container"] : styles.container
      }`}
    >
      <SideBar />

      <div className={styles["window-content"]}>
        <Routes>
          <Route path={Path.Home} element={<Chat />} />
          <Route path={Path.Chat} element={<Chat />} />
          <Route path={Path.Settings} element={<Settings />} />
          <Route path={Path.Video} element={<VideoStudio />} />
          <Route path={`${Path.Square}/:id`} element={<GalleryDetail />} />
          <Route path={Path.Square} element={<Gallery />} />
        </Routes>
      </div>
    </div>
  );
}

function MobileScreen() {
  const location = useLocation();
  const isHome = location.pathname === Path.Home;

  return (
    <div className={styles.container}>
      <SideBar className={isHome ? styles["sidebar-show"] : ""} />

      <div className={styles["window-content"]}>
        <Routes>
          <Route path={Path.Home} element={null} />
          <Route path={Path.Chat} element={<Chat />} />
          <Route path={Path.Settings} element={<Settings />} />
          <Route path={Path.Video} element={<VideoStudio />} />
          <Route path={`${Path.Square}/:id`} element={<GalleryDetail />} />
          <Route path={Path.Square} element={<Gallery />} />
        </Routes>
      </div>
    </div>
  );
}

export function Home() {
  const isMobileScreen = useMobileScreen();
  useSwitchTheme();

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>{isMobileScreen ? <MobileScreen /> : <WideScreen />}</Router>
    </ErrorBoundary>
  );
}

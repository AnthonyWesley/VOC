import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import { useIsMobile } from "../hooks/useIsMobile";

export type TabsType = {
  value: string;
  label: any;
  content: any;
  icon?: any;
};

type AnimatedTabsProps = {
  tabs: TabsType[];
  initialValue?: string; // <-- nova prop
};

export default function AnimatedTabs({
  tabs,
  initialValue,
}: AnimatedTabsProps) {
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState(
    initialValue ?? tabs[0].value, // <-- usa initialValue se existir
  );

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  const sliceToLength = (tabs: any[], label: string) => {
    return tabs.length > 2 ? label.slice(0, 6) : label;
  };

  return (
    <Tabs.Root
      value={activeTab}
      className="flex w-full flex-col-reverse lg:static lg:flex-col"
      onValueChange={setActiveTab}
    >
      <div className="fixed bottom-0 left-0 z-10 w-full border-t border-gray-500/15 lg:static lg:border-t-0 lg:border-b">
        <Tabs.List className="relative flex justify-evenly">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              ref={(el: any) => (tabRefs.current[tab.value] = el)}
              className={clsx(
                "relative cursor-pointer px-4 py-2 text-sm transition-colors",
                activeTab === tab.value
                  ? "font-medium text-sky-100"
                  : "text-slate-400",
              )}
            >
              <div
                className={`flex w-full ${
                  isMobile ? "w-5" : "w-20"
                } justify-center`}
              >
                <Icon
                  icon={tab.icon}
                  text={
                    isMobile
                      ? tab.icon
                        ? ""
                        : sliceToLength(tabs, tab.label)
                      : tab.label
                  }
                  scale={0.5}
                  info={tab.label}
                />
              </div>
            </Tabs.Trigger>
          ))}
          <motion.div
            className="absolute h-[2px] bg-sky-100 lg:bottom-0"
            animate={indicatorStyle}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </Tabs.List>
      </div>

      <div className="my-2">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              activeTab === tab.value && (
                <motion.div
                  key={tab.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm"
                >
                  {tab.content}
                </motion.div>
              ),
          )}
        </AnimatePresence>
      </div>
    </Tabs.Root>
  );
}

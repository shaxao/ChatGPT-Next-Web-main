import React, { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { ALL_MODELS, ModelType } from "../store";
import { IconButton } from "./button";
import styles from "./model-selection.module.scss";
import BotIcon from "../icons/bot.svg";
import BlackBotIcon from "../icons/black-bot.svg";
import CloseIcon from "../icons/close.svg";
import { Modal } from "./ui-lib";

interface ModelSelectionProps {
  models: string[];
  currentModel: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

export function ModelSelectionModal(props: ModelSelectionProps) {
  const [searchValue, setSearchValue] = useState("");

  // Create fuse instance
  const fuse = useMemo(() => {
    return new Fuse(props.models, {
      keys: ["name"],
      threshold: 0.3,
    });
  }, [props.models]);

  const filteredModels = useMemo(() => {
    if (!searchValue) return props.models;
    return fuse.search(searchValue).map((result) => result.item);
  }, [fuse, searchValue, props.models]);

  return (
    <div className="modal-mask">
      <Modal title="选择模型" onClose={props.onClose}>
        <div className={styles["model-selection"]}>
          <div className={styles["search-bar"]}>
            <input
              type="text"
              placeholder="搜索模型..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={styles["search-input"]}
              autoFocus
            />
          </div>

          <div className={styles["model-grid"]}>
            {filteredModels.map((model) => (
              <div
                key={model}
                className={`${styles["model-card"]} ${
                  model === props.currentModel ? styles["selected"] : ""
                } clickable`}
                onClick={() => {
                  props.onSelect(model);
                  props.onClose();
                }}
              >
                <div className={styles["model-icon"]}>
                  {model.startsWith("gpt-4") ? <BlackBotIcon /> : <BotIcon />}
                </div>
                <div className={styles["model-name"]}>{model}</div>
                {model === props.currentModel && (
                  <div className={styles["model-check"]}>✓</div>
                )}
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className={styles["no-result"]}>未找到相关模型</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

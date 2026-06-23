(function (ALB) {
  const ROOT_ID = "alb-floating-root";

  const HISTORY_ICON = `
    <svg class="alb-floating-history-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.75"></circle>
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"></path>
    </svg>
  `;

  ALB.createFloatingButton = function createFloatingButton({ onClick, onHistoryClick }) {
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "alb-floating-root";

    const bar = document.createElement("div");
    bar.className = "alb-floating-bar";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "alb-floating-button";

    const label = document.createElement("span");
    label.className = "alb-floating-label";

    const progress = document.createElement("div");
    progress.className = "alb-floating-progress";
    progress.hidden = true;

    const progressBar = document.createElement("div");
    progressBar.className = "alb-floating-progress-bar";
    progress.appendChild(progressBar);

    button.append(label, progress);
    button.addEventListener("click", (event) => onClick(event));

    const historyButton = document.createElement("button");
    historyButton.type = "button";
    historyButton.className = "alb-floating-history";
    historyButton.title = "Run history";
    historyButton.setAttribute("aria-label", "Run history");
    historyButton.innerHTML = HISTORY_ICON;

    const historyBadge = document.createElement("span");
    historyBadge.className = "alb-floating-history-badge";
    historyBadge.hidden = true;
    historyButton.appendChild(historyBadge);

    historyButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (onHistoryClick) {
        onHistoryClick(event);
      }
    });

    bar.append(button, historyButton);
    root.appendChild(bar);
    document.documentElement.appendChild(root);

    return {
      root,
      setState({ text, disabled, progressRatio, progressText }) {
        label.textContent = text;
        button.disabled = Boolean(disabled);

        if (progressRatio != null) {
          progress.hidden = false;
          progressBar.style.width = `${Math.round(progressRatio * 100)}%`;
          if (progressText) {
            label.textContent = progressText;
          }
        } else {
          progress.hidden = true;
          progressBar.style.width = "0%";
        }
      },
      setHistoryCount(count) {
        if (count > 0) {
          historyBadge.hidden = false;
          historyBadge.textContent = count > 99 ? "99+" : String(count);
        } else {
          historyBadge.hidden = true;
          historyBadge.textContent = "";
        }
      },
    };
  };
})(window.ALB);
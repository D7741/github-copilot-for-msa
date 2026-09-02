import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createLightTheme,
  FluentProvider,
  type BrandVariants,
} from "@fluentui/react-components";

import App from "./App";
import "./styles.css";

const finderBrand: BrandVariants = {
  10: "#06152F", 20: "#092653", 30: "#0B3777", 40: "#0D489C",
  50: "#1058BD", 60: "#1261CE", 70: "#1467D9", 80: "#1769E0",
  90: "#347FE7", 100: "#5595EC", 110: "#75AAF0", 120: "#94BDF4",
  130: "#B1D0F7", 140: "#CCE0FA", 150: "#E3EEFC", 160: "#F3F8FE",
};

const theme = createLightTheme(finderBrand);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FluentProvider theme={theme}>
      <App />
    </FluentProvider>
  </StrictMode>,
);

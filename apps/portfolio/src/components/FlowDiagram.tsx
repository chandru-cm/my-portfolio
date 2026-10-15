import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Cta from "./Cta";

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.5, delayChildren: 0.15 } },
};
const node: Variants = {
  hidden: { opacity: 0.3, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
// "--p" drives the connector fill in CSS, so it works for both row and column layouts.
const link: Variants = {
  hidden: { "--p": 0 } as never,
  show: { "--p": 1, transition: { duration: 0.5, delay: 0.25 } } as never,
};

type Props = { steps: string[] };

/** Architecture flow that draws itself step by step when scrolled into view. */
export default function FlowDiagram({ steps }: Props) {
  const [run, setRun] = useState(0);
  return (
    <div>
      <motion.ol
        key={run}
        className="flow"
        aria-label="Architecture flow"
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        {steps.map((step, i) => (
          <motion.li className="flow-step" key={step} variants={node}>
            <span className="flow-node">{step}</span>
            {i < steps.length - 1 && <motion.span className="flow-link" aria-hidden="true" variants={link} />}
          </motion.li>
        ))}
      </motion.ol>
      <Cta kind="action" onClick={() => setRun((r) => r + 1)}>
        Replay animation
      </Cta>
    </div>
  );
}

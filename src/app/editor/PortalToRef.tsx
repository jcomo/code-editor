import ReactDOM from "react-dom";

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
};

/**
 * Creates a portal given a ref. This is useful for placing content from a render props
 * function into another div on the page.
 */
export function PortalToRef({
  children,
  containerRef,
}: React.PropsWithChildren<Props>) {
  return containerRef.current
    ? ReactDOM.createPortal(children, containerRef.current)
    : null;
}

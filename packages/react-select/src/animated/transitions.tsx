import * as React from 'react';
import { ComponentType, CSSProperties, ReactNode, useRef } from 'react';
import { Transition } from 'react-transition-group';
import {
  ExitHandler,
  TransitionStatus,
} from 'react-transition-group/Transition';

// ==============================
// Fade Transition
// ==============================

type FadeProps<ComponentProps> = {
  component: ComponentType<ComponentProps>;
  in?: boolean;
  onExited?: ExitHandler<undefined | HTMLElement>;
  duration?: number;
} & ComponentProps;
export const Fade = <ComponentProps extends {}>({
  component: Tag,
  duration = 1,
  in: inProp,
  onExited,
  ...props
}: FadeProps<ComponentProps>) => {
  const nodeRef = useRef<HTMLElement>(null);

  const transition: { [K in TransitionStatus]?: CSSProperties } = {
    entering: { opacity: 0 },
    entered: { opacity: 1, transition: `opacity ${duration}ms` },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  };

  return (
    <Transition
      mountOnEnter
      unmountOnExit
      in={inProp}
      timeout={duration}
      nodeRef={nodeRef}
    >
      {(state) => {
        const innerProps = {
          style: {
            ...transition[state],
          },
          ref: nodeRef,
        };
        return <Tag innerProps={innerProps} {...(props as any)} />;
      }}
    </Transition>
  );
};

// ==============================
// Collapse Transition
// ==============================

export const collapseDuration = 260;

type Width = number | 'auto';

/** Get base styles. */
function getBaseStyles(width: Width): CSSProperties {
  return {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width,
  };
}

const transition: { [K in TransitionStatus]?: CSSProperties } = {
  exiting: { width: 0, transition: `width ${collapseDuration}ms ease-out` },
  exited: { width: 0 },
};

/** Get styles based on the transition state. */
function getTransitionStyles(state: TransitionStatus) {
  return transition[state];
}

interface CollapseProps {
  /** The children to be rendered. */
  children: ReactNode;
  /** Show the component; triggers the enter or exit states. */
  in?: boolean;
  /** Callback fired after the "exited" status is applied. */
  onExited?: ExitHandler<undefined | HTMLElement>;
}

/**
 * Wrap each MultiValue with a collapse transition; decreases width until
 * finally removing from DOM.
 */
export function Collapse({
  children,
  in: inProp,
  onExited: onExitedProp,
}: CollapseProps) {
  const [width, setWidth] = React.useState<Width>('auto');
  const nodeRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    /**
     * Here we're invoking requestAnimationFrame with a callback invoking our
     * call to getBoundingClientRect and setWidth in order to resolve an
     * edge-case around portalling.
     * Certain portalling solutions briefly remove children from the DOM before
     * appending them to the target node. This is to avoid us trying to call
     * getBoundingClientRect while the Select component is in this state.
     *
     * NOTE: we cannot use offsetWidth here because it is rounded.
     */
    const id = window.requestAnimationFrame(() => {
      if (nodeRef.current) {
        setWidth(nodeRef.current.getBoundingClientRect().width);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const onExited = React.useCallback(() => {
    if (nodeRef.current && onExitedProp) {
      onExitedProp(nodeRef.current);
    }
  }, [onExitedProp]);

  return (
    <Transition
      enter={false}
      mountOnEnter
      unmountOnExit
      in={inProp}
      onExited={onExited}
      timeout={collapseDuration}
      nodeRef={nodeRef}
    >
      {(state) => {
        const style = {
          ...getBaseStyles(width),
          ...getTransitionStyles(state),
        };
        return (
          <div ref={nodeRef} style={style}>
            {children}
          </div>
        );
      }}
    </Transition>
  );
}

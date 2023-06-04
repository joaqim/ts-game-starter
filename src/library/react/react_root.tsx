import React, { useEffect, useReducer } from "react";
import ReactDOM from "react-dom";

import { BaseGame } from "../base_game";
import { Hierarchy } from "./hierarchy";
import { DebugFlagButtons, DebugFlagsType } from "./debug_flag_buttons";
import { IS_DEBUG } from "../environment";
import { Entity } from "../entity";
import { Container } from "pixi.js";
import { TextEntity } from "../text_entity";
import { Debug } from "../debug";

type ReactWrapperProps = {
  game: BaseGame<{}>;
  debugFlags: DebugFlagsType;
};

type GameReactActionType = "SET_SELECTED_ENTITY" | "SET_MOUSED_OVER_ENTITY";

interface GameReactAction {
  payload: Entity | Container | null;
  type: GameReactActionType;
}

interface GameReactState {
  selectedEntity: Entity | Container | null;
  mousedEntity: Entity | Container | null;
}

const GameReactWrapper = (props: ReactWrapperProps) => {
  const [state, dispatch] = useReducer(
    (state: GameReactState, action: GameReactAction): GameReactState => {
      switch (action.type) {
        case "SET_SELECTED_ENTITY":
          return { ...state, selectedEntity: action.payload };
        case "SET_MOUSED_OVER_ENTITY":
          return { ...state, mousedEntity: action.payload };
        default:
          return state;
      }
    },
    {
      selectedEntity: props.game.stage,
      mousedEntity: null,
    }
  );

  const setSelectedEntity = (entity: Entity | Container | null): void => {
    dispatch({ type: "SET_SELECTED_ENTITY", payload: entity });
  };
  const setMousedEntity = (entity: Entity | Container | null): void => {
    dispatch({ type: "SET_MOUSED_OVER_ENTITY", payload: entity });
  };

  // This useEffect hook is used to update state.selectedEntity variable
  // with the stage property of the BaseGame at an interval of 500ms.
  /* useEffect(() => {
    const interval = setInterval(() => {
      setSelectedEntity(props.game.stage);
      console.log("update");
    }, 500);

    // Clear the interval when the component unmounts.
    return () => clearInterval(interval);
  });
 */
  useEffect(() => {
    setSelectedEntity(props.game.stage);
  }, [props.game.stage]);

  const renderSelectedEntityInfo = () => {
    const targetEntity = state.mousedEntity || state.selectedEntity;

    if (targetEntity === null) {
      return null;
    }

    if (targetEntity instanceof Container) {
      return (
        <div
          style={{
            fontWeight: 600,
            fontFamily: "arial",
            paddingTop: "8px",
            paddingBottom: "8px",
            fontSize: "18px",
          }}
        >
          Stage
        </div>
      );
    }

    return (
      <div>
        <div
          style={{
            fontWeight: 600,
            fontFamily: "arial",
            paddingTop: "8px",
            paddingBottom: "8px",
            fontSize: "18px",
          }}
        >
          {targetEntity.name}
        </div>
        <div>
          x: {targetEntity.x}, y: {targetEntity.y}
        </div>
        <div>
          xAbs: {targetEntity.positionAbsolute().x}, yAbs:{" "}
          {targetEntity.positionAbsolute().y}
        </div>
        <div>
          width: {targetEntity.width}, height: {targetEntity.height}
        </div>
        <div>visible: {targetEntity.visible ? "true" : "false"}</div>
        <div>
          collideable: {targetEntity.isCollideable() ? "true" : "false"}
        </div>
        <div>
          scaleX: {targetEntity.scale.x.toFixed(2)} scaleY:{" "}
          {targetEntity.scale.y.toFixed(2)}
        </div>
        {targetEntity instanceof TextEntity ? (
          <div>text: {targetEntity.html}</div>
        ) : (
          <div>{/* Entity has no Text */}</div>
        )}
      </div>
    );
  };

  const renderHierarchy = () => {
    return (
      <div>
        <Hierarchy
          selectedEntity={state.selectedEntity}
          setMoused={setMousedEntity}
          setSelected={setSelectedEntity}
          root={props.game.stage}
          gameState={props.game.state}
        />

        <Hierarchy
          selectedEntity={state.mousedEntity}
          setMoused={setMousedEntity}
          setSelected={setSelectedEntity}
          root={props.game.fixedCameraStage}
          gameState={props.game.state}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        borderLeft: IS_DEBUG ? "1px solid lightgray" : 0,
        marginLeft: "16px",
        paddingLeft: "8px",
      }}
    >
      <div
        style={{
          overflow: "auto",
          height: "90vh",
          fontFamily: "arial",
          fontSize: "14px",
        }}
      >
        {props.game && props.game.stage && IS_DEBUG && (
          <div style={{ paddingLeft: "8px" }}>
            <div
              style={{
                fontFamily: "arial",
                marginBottom: "8px",
                fontSize: "14px",
                width: "300px",
                padding: "8px",
              }}
            >
              Note: This debugging panel is only shown in development, or
              production with ?debug=true.
            </div>
            <div
              style={{
                fontWeight: 600,
                fontFamily: "arial",
                paddingBottom: "8px",
                fontSize: "18px",
              }}
            >
              Debug Options
            </div>
            <DebugFlagButtons flags={props.debugFlags} />

            <div>Draw Count: {Debug.GetDrawCount()}</div>
            {renderSelectedEntityInfo()}

            <div
              style={{
                fontWeight: 600,
                fontFamily: "arial",
                paddingTop: "8px",
                paddingBottom: "8px",
                fontSize: "18px",
              }}
            >
              Debug Hierarchy
            </div>
            {renderHierarchy()}
          </div>
        )}
      </div>
    </div>
  );
};

export const CreateGame = (game: BaseGame<any>, debugFlags: DebugFlagsType) => {
  ReactDOM.render(
    <React.StrictMode>
      <GameReactWrapper game={game} debugFlags={debugFlags} />
    </React.StrictMode>,
    document.getElementById("root")
  );
};

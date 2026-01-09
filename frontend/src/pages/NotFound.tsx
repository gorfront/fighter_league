// import { useLocation } from "react-router-dom";
// import { useEffect } from "react";

// const NotFound = () => {
//   const location = useLocation();

//   useEffect(() => {
//     console.error("404 Error: User attempted to access non-existent route:", location.pathname);
//   }, [location.pathname]);

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100">
//       <div className="text-center">
//         <h1 className="mb-4 text-4xl font-bold">404</h1>
//         <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
//         <a href="/" className="text-blue-500 underline hover:text-blue-700">
//           Return to Home
//         </a>
//       </div>
//     </div>
//   );
// };

// export default NotFound;

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Swords, ArrowUp, ArrowDown, Wind } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_HP = 100;
const MOVEMENT_SPEED = 4.5;
const JUMP_FORCE = 18;
const GRAVITY = 1.2;
const HIT_RANGE = 14;

const FRICTION = 0.85;
const DASH_FORCE = 4.0;
const MAX_VELOCITY = 5.0;

const CPU_TICK_RATE = 30;
const CPU_DAMAGE = 12;

type FighterState =
  | "IDLE"
  | "WALK"
  | "DASH"
  | "ATTACK"
  | "BLOCK"
  | "HIT"
  | "JUMP"
  | "SQUAT"
  | "LOSE";

const FighterFigure = ({
  state,
  color,
  yPos,
  isCpu = false,
  facingRight = true,
}: {
  state: FighterState;
  color: string;
  yPos: number;
  isCpu?: boolean;
  facingRight?: boolean;
}) => {
  const bodyColor = isCpu ? "bg-zinc-900" : "bg-blue-600";
  const gloveColor = isCpu ? "bg-emerald-500" : "bg-red-600";

  const transformStyle = `translateY(-${yPos}px) ${!facingRight ? "scaleX(-1)" : ""
    }`;

  return (
    <div
      className={cn(
        "relative h-36 w-20 transition-transform duration-75",
        state === "HIT" && "rotate-12 opacity-80",
        state === "LOSE" && "rotate-90 translate-y-16 opacity-50"
      )}
      style={{ transform: transformStyle }}
    >
      {isCpu && Math.abs(yPos) > 0 && (
        <div className="absolute top-10 left-2 h-16 w-14 rounded-xl bg-emerald-500/30 blur-sm animate-pulse" />
      )}
      <div
        className={cn(
          "absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-black z-20 shadow-xl transition-all",
          state === "SQUAT" && "top-8",
          bodyColor
        )}
      >
        {isCpu && (
          <div className="absolute top-3 flex w-full justify-around">
            <div className="h-1 w-1 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
            <div className="h-1 w-1 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
          </div>
        )}
      </div>
      <div
        className={cn(
          "absolute left-1/2 h-16 w-14 -translate-x-1/2 rounded-xl border-2 border-black z-10 shadow-lg transition-all",
          state === "SQUAT" ? "top-14 h-10 scale-y-75" : "top-10",
          bodyColor
        )}
      />
      <div
        className={cn(
          "absolute h-5 w-12 rounded-full bg-black transition-all duration-75 origin-left z-30",
          "left-1",
          state === "SQUAT" ? "top-16" : "top-12",
          state === "ATTACK"
            ? "w-28 translate-x-10"
            : state === "BLOCK"
              ? "-rotate-45"
              : "rotate-[100deg]"
        )}
      >
        <div
          className={cn(
            "absolute h-9 w-9 rounded-full border-2 border-white top-[-10px] right-[-15px]",
            gloveColor
          )}
        />
      </div>
      <div className="absolute bottom-0 w-full h-12">
        <div
          className={cn(
            "absolute bottom-0 left-2 w-5 bg-zinc-800 rounded-t-sm transition-all",
            state === "JUMP" ? "h-6" : state === "SQUAT" ? "h-4" : "h-12"
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-2 w-5 bg-zinc-800 rounded-t-sm transition-all",
            state === "JUMP" ? "h-6" : state === "SQUAT" ? "h-4" : "h-12"
          )}
        />
      </div>
    </div>
  );
};

export default function NotFoundGame() {
  const navigate = useNavigate();
  const [gameActive, setGameActive] = useState(false);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [cpuHp, setCpuHp] = useState(MAX_HP);

  const [playerPos, setPlayerPos] = useState(20);
  const [cpuPos, setCpuPos] = useState(80);
  const [playerY, setPlayerY] = useState(0);
  const [playerVelY, setPlayerVelY] = useState(0);
  const [cpuY, setCpuY] = useState(0);
  const [cpuVelY, setCpuVelY] = useState(0);

  const [cpuVelX, setCpuVelX] = useState(0);

  const [playerAction, setPlayerAction] = useState<FighterState>("IDLE");
  const [cpuAction, setCpuAction] = useState<FighterState>("IDLE");
  const [log, setLog] = useState("HYPER SPEED READY");

  const keysPressed = useRef<Set<string>>(new Set());
  const cpuCooldown = useRef(0);

  useEffect(() => {
    if (!gameActive) return;
    const physics = setInterval(() => {
      setPlayerY((y) => {
        const nextY = y + playerVelY;
        if (nextY <= 0) {
          if (playerAction === "JUMP") setPlayerAction("IDLE");
          setPlayerVelY(0);
          return 0;
        }
        setPlayerVelY((v) => v - GRAVITY);
        return nextY;
      });

      setCpuY((y) => {
        const nextY = y + cpuVelY;
        if (nextY <= 0) {
          if (cpuAction === "JUMP") setCpuAction("IDLE");
          setCpuVelY(0);
          return 0;
        }
        setCpuVelY((v) => v - GRAVITY);
        return nextY;
      });

      setCpuPos((p) => {
        let nextP = p + cpuVelX;
        if (nextP < 2) nextP = 2;
        if (nextP > 98) nextP = 98;
        return nextP;
      });

      setCpuVelX((v) => {
        const nextV = v * FRICTION;
        return Math.abs(nextV) < 0.1 ? 0 : nextV;
      });

      if (["IDLE", "WALK", "JUMP"].includes(playerAction)) {
        if (
          keysPressed.current.has("ArrowLeft") ||
          keysPressed.current.has("KeyA")
        ) {
          setPlayerPos((p) => Math.max(5, p - MOVEMENT_SPEED));
          if (playerY === 0) setPlayerAction("WALK");
        } else if (
          keysPressed.current.has("ArrowRight") ||
          keysPressed.current.has("KeyD")
        ) {
          setPlayerPos((p) => Math.min(95, p + MOVEMENT_SPEED));
          if (playerY === 0) setPlayerAction("WALK");
        }
      }
    }, 25);
    return () => clearInterval(physics);
  }, [
    gameActive,
    playerVelY,
    cpuVelY,
    playerAction,
    playerY,
    cpuVelX,
    cpuAction,
  ]);

  const performAttack = useCallback(
    (isPlayer: boolean) => {
      const attackerAction = isPlayer ? playerAction : cpuAction;
      if (
        !gameActive ||
        attackerAction === "ATTACK" ||
        attackerAction === "HIT"
      )
        return;

      if (isPlayer) setPlayerAction("ATTACK");
      else setCpuAction("ATTACK");

      setTimeout(() => {
        const dist = Math.abs(cpuPos - playerPos);
        const attackerY = isPlayer ? playerY : cpuY;
        const targetY = isPlayer ? cpuY : playerY;
        const targetAction = isPlayer ? cpuAction : playerAction;

        if (dist <= HIT_RANGE) {
          const targetSquatting = targetAction === "SQUAT";
          const heightDiff = Math.abs(attackerY - targetY);

          if (heightDiff < 40) {
            if (targetSquatting && attackerY < 10) {
              setLog(isPlayer ? "CPU DUCKED" : "YOU DUCKED");
            }

            let finalPlayerHp = playerHp;
            let finalCpuHp = cpuHp;

            if (isPlayer) {
              finalCpuHp = Math.max(0, cpuHp - 8);
              setCpuHp(finalCpuHp);
              setCpuAction("HIT");
              setCpuVelX(playerPos < cpuPos ? 8 : -8);
            } else {
              finalPlayerHp = Math.max(0, playerHp - CPU_DAMAGE);
              setPlayerHp(finalPlayerHp);
              setPlayerAction("HIT");
            }
            setLog(isPlayer ? "HIT!" : "SPEED BLITZ!");

            if (finalPlayerHp <= 0 || finalCpuHp <= 0) {
              setGameActive(false);
              setLog(finalPlayerHp <= 0 ? "DEFEAT" : "VICTORY");
              if (finalPlayerHp <= 0) setPlayerAction("LOSE");
              else setCpuAction("LOSE");
            }
          }
        }
        setTimeout(() => {
          if (isPlayer) setPlayerAction(playerY > 0 ? "JUMP" : "IDLE");
          else setCpuAction(cpuY > 0 ? "JUMP" : "IDLE");
          setCpuAction((c) => (c === "HIT" ? "IDLE" : c));
          setPlayerAction((p) => (p === "HIT" ? "IDLE" : p));
        }, 150);
      }, 100);
    },
    [
      gameActive,
      playerAction,
      cpuAction,
      cpuPos,
      playerPos,
      playerY,
      cpuY,
      playerHp,
      cpuHp,
    ]
  );

  useEffect(() => {
    if (!gameActive) return;

    const ai = setInterval(() => {
      if (cpuAction === "HIT" || cpuAction === "LOSE" || cpuAction === "ATTACK")
        return;

      if (cpuCooldown.current > 0) {
        cpuCooldown.current -= 1;
        return;
      }

      const dist = Math.abs(cpuPos - playerPos);
      const isPlayerAttacking = playerAction === "ATTACK";
      const dirToPlayer = playerPos > cpuPos ? 1 : -1;

      if (playerY > 25 && dist < 30 && cpuY === 0) {
        setCpuVelX(dirToPlayer * DASH_FORCE * 2.5);
        setLog("CROSS UP!");
        cpuCooldown.current = 10;
        return;
      }

      if (isPlayerAttacking && dist > HIT_RANGE + 5) {
        setLog("WHIFF PUNISH");
        setCpuVelX(dirToPlayer * DASH_FORCE * 2);
        setTimeout(() => performAttack(false), 100);
        cpuCooldown.current = 15;
        return;
      }

      if (isPlayerAttacking && dist < HIT_RANGE + 10) {
        setCpuVelX(-dirToPlayer * DASH_FORCE * 2);
        setLog("BACK DASH");
        cpuCooldown.current = 8;
        return;
      }

      if (dist > HIT_RANGE) {
        if (Math.random() < 0.3) {
          setCpuVelX(dirToPlayer * 2);
        } else if (Math.random() < 0.6) {
          setCpuVelX(-dirToPlayer * 2);
        }
      } else {
        performAttack(false);
        cpuCooldown.current = 5;
      }
    }, CPU_TICK_RATE);
    return () => clearInterval(ai);
  }, [
    gameActive,
    cpuPos,
    playerPos,
    playerAction,
    playerY,
    cpuAction,
    cpuY,
    performAttack,
  ]);

  const resetGame = useCallback(() => {
    setPlayerHp(MAX_HP);
    setCpuHp(MAX_HP);
    setPlayerPos(20);
    setCpuPos(80);
    setPlayerY(0);
    setCpuY(0);
    setCpuVelX(0);
    setPlayerAction("IDLE");
    setCpuAction("IDLE");
    setGameActive(true);
    setLog("FIGHT!");
    cpuCooldown.current = 0;
  }, []);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      const isJump = e.code === "ArrowUp" || e.code === "KeyW";
      const isDuck = e.code === "ArrowDown" || e.code === "KeyS";
      if (isJump && playerY === 0) {
        setPlayerVelY(JUMP_FORCE);
        setPlayerAction("JUMP");
      }
      if (isDuck && playerY === 0) setPlayerAction("SQUAT");
      if (e.code === "Space") performAttack(true);
      if (e.code === "Enter" && !gameActive) resetGame();
    };
    const handleUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      const isDuck = e.code === "ArrowDown" || e.code === "KeyS";
      if (isDuck && playerAction === "SQUAT") setPlayerAction("IDLE");
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [gameActive, playerY, playerAction, performAttack, resetGame]);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4 font-mono select-none overflow-hidden">
      <div className="mb-6 text-center">
        <h1 className="text-6xl font-black italic text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
          404 VELOCITY
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400 font-bold uppercase text-[10px] tracking-widest">
          <Wind size={12} /> Hyper-Agility Engine Active <Wind size={12} />
        </div>
      </div>
      <div className="relative w-full max-w-4xl rounded-2xl border-4 border-zinc-800 bg-black shadow-2xl overflow-hidden">
        <div className="flex justify-between p-6 bg-zinc-900/50">
          <HealthBar hp={playerHp} name="PLAYER" color="bg-blue-600" />
          <div className="text-4xl font-black italic text-yellow-500 px-6">
            99
          </div>
          <HealthBar
            hp={cpuHp}
            name="SPEEDSTER"
            color="bg-emerald-500"
            isRight
          />
        </div>
        <div className="relative h-96 bg-[radial-gradient(circle_at_bottom,_#222_0%,_#000_70%)]">
          <div className="absolute top-10 w-full text-center text-2xl font-black italic tracking-widest uppercase text-white/20">
            {log}
          </div>
          <div className="absolute bottom-20 left-0 right-0 h-40 px-12">
            <div
              className="absolute bottom-0 z-20"
              style={{ left: `${playerPos}%`, transform: "translateX(-50%)" }}
            >
              <FighterFigure
                state={playerAction}
                color="blue"
                yPos={playerY}
                facingRight={playerPos < cpuPos}
              />
            </div>
            <div
              className="absolute bottom-0 z-10"
              style={{ left: `${cpuPos}%`, transform: "translateX(-50%)" }}
            >
              <FighterFigure
                state={cpuAction}
                color="red"
                yPos={cpuY}
                isCpu
                facingRight={cpuPos < playerPos}
              />
            </div>
          </div>
          <div className="absolute bottom-0 w-full h-16 bg-zinc-900/20 border-t border-zinc-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="p-5 bg-zinc-900 border-t-2 border-zinc-800 flex justify-center items-center gap-12">
          {!gameActive ? (
            <button
              onClick={resetGame}
              className="bg-white text-black px-16 py-3 font-black uppercase tracking-tighter hover:bg-emerald-500 hover:text-white transition-all"
            >
              Ready (Enter)
            </button>
          ) : (
            <div className="flex gap-12 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-2 text-blue-400">
                <ArrowUp size={14} /> W / UP: Jump
              </span>
              <span className="flex items-center gap-2 text-yellow-500">
                <ArrowDown size={14} /> S / DOWN: Duck
              </span>
              <span className="flex items-center gap-2 text-red-500">
                <Swords size={14} /> Space: Strike
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => navigate("/")}
        className="mt-8 text-zinc-600 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-2"
      >
        <Home size={14} /> Exit Arena
      </button>
    </div>
  );
}

function HealthBar({
  hp,
  name,
  color,
  isRight = false,
}: {
  hp: number;
  name: string;
  color: string;
  isRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-[42%] flex flex-col",
        isRight ? "items-end" : "items-start"
      )}
    >
      <div className="text-[10px] font-black mb-1 italic opacity-60 uppercase">
        {name}
      </div>
      <div className="h-6 w-full bg-zinc-950 border border-zinc-800 shadow-inner">
        <div
          className={cn("h-full transition-all duration-300 shadow-lg", color)}
          style={{ width: `${hp}%` }}
        />
      </div>
    </div>
  );
}

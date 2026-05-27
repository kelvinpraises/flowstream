def format_frame(ts: int, ball_pos, score: list, game_min: float, period: int, possession: int, events: list, player_data) -> dict:
    """
    Format raw CV detection data into the strict JSON schema expected by
    the TypeScript ObservationFrame interface.
    """
    return {
        "ts": ts,
        "ball": ball_pos,
        "score": score,
        "min": round(game_min, 1),
        "period": period,
        "possession": possession,
        "events": events,
        "players": player_data,
        "formations": None,
    }

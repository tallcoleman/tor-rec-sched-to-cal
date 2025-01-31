# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pandas",
# ]
# ///

from datetime import datetime
from pathlib import Path

import pandas as pd


def analyze_schedule(schedule_path: Path, locations_path: Path):
    schedule = pd.read_json(schedule_path).convert_dtypes()
    schedule = schedule.assign(
        **{
            "Age Min": schedule["Age Min"]
            .replace("None", None)
            .astype(pd.Int64Dtype()),
            "Age Max": schedule["Age Max"]
            .replace("None", None)
            .astype(pd.Int64Dtype()),
            "Start Date Time": schedule["Start Date Time"].astype("datetime64[ns]"),
        }
    )

    locations = pd.read_json(locations_path).convert_dtypes()
    schedule = schedule.merge(
        locations[["Location ID", "Location Name", "Postal Code"]],
        how="left",
        on=["Location ID"],
    )

    s_schedule = schedule[schedule["Category"] == "Swimming"]
    print("All facilities all swimming", s_schedule["Start Date Time"].dt.date.max())

    ws_schedule = schedule[
        (schedule["Location ID"] == 451) & (schedule["Category"] == "Swimming")
    ]
    wsl_schedule = ws_schedule[ws_schedule["Course Title"] == "Lane Swim"]
    print("Wellesley Lane Swim", wsl_schedule["Start Date Time"].dt.date.max())
    print("Wellesley all swimming", ws_schedule["Start Date Time"].dt.date.max())

    ps_schedule = schedule[
        (schedule["Location ID"] == 2012) & (schedule["Category"] == "Swimming")
    ]
    print("PMAC all swimming", ps_schedule["Start Date Time"].dt.date.max())

    s_schedule.pivot_table(
        values="Start Date Time", index=["Location ID", "Location Name"], aggfunc="max"
    ).sort_values("Start Date Time")

    breakpoint()


if __name__ == "__main__":
    analyze_schedule(
        Path("open_data_analysis/Drop-in.json"),
        Path("open_data_analysis/Locations.json"),
    )

"""
ランク変換ユーティリティ
ランク値とランク名の相互変換を提供
"""

from typing import Optional

# ランクマッピング定義
RANK_MAPPING = {
    1: "ビギナー2",
    2: "ビギナー1",
    3: "ブロンズ5",
    4: "ブロンズ4",
    5: "ブロンズ3",
    6: "ブロンズ2",
    7: "ブロンズ1",
    8: "シルバー5",
    9: "シルバー4",
    10: "シルバー3",
    11: "シルバー2",
    12: "シルバー1",
    13: "ゴールド5",
    14: "ゴールド4",
    15: "ゴールド3",
    16: "ゴールド2",
    17: "ゴールド1",
    18: "プラチナ5",
    19: "プラチナ4",
    20: "プラチナ3",
    21: "プラチナ2",
    22: "プラチナ1",
    23: "ダイヤ5",
    24: "ダイヤ4",
    25: "ダイヤ3",
    26: "ダイヤ2",
    27: "ダイヤ1",
    28: "マスター5",
    29: "マスター4",
    30: "マスター3",
    31: "マスター2",
    32: "マスター1",
}

# 逆マッピング（名前から値へ）
RANK_NAME_TO_VALUE = {name: value for value, name in RANK_MAPPING.items()}


def get_rank_name(rank_value: Optional[int]) -> str:
    """
    ランク値をランク名に変換

    Args:
        rank_value: ランク値（1-32）

    Returns:
        ランク名（例: "ゴールド1"）、値がNoneまたは不明な場合は空文字列または"不明"
    """
    if rank_value is None:
        return ""
    return RANK_MAPPING.get(rank_value, "不明")


def get_rank_value(rank_label: Optional[str]) -> Optional[int]:
    """
    ランク名をランク値に変換

    Args:
        rank_label: ランク名（例: "ゴールド1"）

    Returns:
        ランク値（1-32）、名前がNoneまたは不明な場合はNone
    """
    if not rank_label:
        return None
    return RANK_NAME_TO_VALUE.get(rank_label)

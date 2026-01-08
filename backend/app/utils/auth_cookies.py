from typing import Optional, Tuple


def is_safari_browser(user_agent: str) -> bool:
    """
    User-AgentからSafariブラウザを判定

    Safari（特にiOS/iPadOS）はSameSite=Noneのクッキーを厳しく制限するため、
    SameSite=Laxを使用する必要がある
    """
    if not user_agent:
        return False

    user_agent_lower = user_agent.lower()

    # Safariの判定（ChromeやEdgeではない純粋なSafari）
    is_safari = (
        "safari" in user_agent_lower
        and "chrome" not in user_agent_lower
        and "edg" not in user_agent_lower
    )

    # iOSデバイスの判定
    is_ios = (
        "iphone" in user_agent_lower
        or "ipad" in user_agent_lower
        or "ipod" in user_agent_lower
    )

    return is_safari or is_ios


def resolve_cookie_policy(
    user_agent: Optional[str], is_production: bool
) -> Tuple[str, bool, bool]:
    is_safari = is_safari_browser(user_agent or "")

    if is_safari:
        samesite_value = "lax"
        secure_value = True if is_production else False
    else:
        samesite_value = "none" if is_production else "lax"
        secure_value = is_production

    return samesite_value, secure_value, is_safari

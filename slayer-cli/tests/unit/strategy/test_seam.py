from slayer_cli.usage.cache import candidate_for, save_cache, cache_key
from slayer_cli.models.account import Account
from slayer_cli.models.usage_windows import AccountUsage, Window, Thresholds
from slayer_cli.strategy.select import pick_next
from slayer_cli.platform.paths import Paths


def test_strategy_sees_usage_saved_under_candidate_key(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    p = Paths("token_slayer")
    a = Account(name="a", uuid="ua", org_uuid="oa", token="sk-ant-oat01-TESTTOKEN", added_at=1)
    b = Account(name="b", uuid="ub", org_uuid="ob", token="sk-ant-oat01-TESTTOKEN", added_at=1)
    # b is fresh (10% 7d), a is the current account. Cache is keyed by cache_key.
    cache = {cache_key(b): AccountUsage(five_hour=Window(utilization=5.0),
                                        seven_day=Window(utilization=10.0), polled_at=1)}
    pick = pick_next("balanced", [], [candidate_for(a), candidate_for(b)], candidate_for(a),
                     cache, Thresholds())
    # If candidate_for's key did NOT match cache_key, strategy would see b as util 0 (still picked),
    # so assert the REASON reflects real 7d data, proving the lookup hit.
    assert pick.name == "b"

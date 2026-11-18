from transformers import PretrainedConfig

_VARIANT_DEFAULTS = {
    "b0": dict(
        backbone_name="tf_efficientnet_b0.ns_jft_in1k", img_size=[224, 224],
        l_block_idx=1, h_block_idx=6,
        l_dim=24, h_dim=256,
        l_depths=[2, 2, 4, 2], h_depths=[4],
        l_windows=[7, 7, 14, 7], h_windows=[7],
        l_heads=[1, 2, 4, 8], h_heads=[4],
        l_ratio=[4, 4, 4, 4], h_ratio=[4],
        l_drop=0.0, h_drop=0.05, l_attn_drop=0.05, h_attn_drop=0.0,
        l_drop_path=0.1, h_drop_path=0.05,
    ),
    "b5": dict(
        backbone_name="tf_efficientnet_b5.ns_jft_in1k", img_size=[384, 384],
        l_block_idx=1, h_block_idx=6,
        l_dim=48, h_dim=512,
        l_depths=[2, 2, 6, 2], h_depths=[6],
        l_windows=[12, 12, 24, 12], h_windows=[12],
        l_heads=[2, 4, 8, 16], h_heads=[16],
        l_ratio=[3, 3, 3, 3], h_ratio=[3],
        l_drop=0.0, h_drop=0.1, l_attn_drop=0.1, h_attn_drop=0.0,
        l_drop_path=0.15, h_drop_path=0.1,
    ),
}


class MsEffGCViTConfig(PretrainedConfig):
    model_type = "ms_eff_gcvit"

    def __init__(self, variant="b0", dataset="celeb_df_v2", **kwargs):
        self.variant = variant
        self.dataset = dataset

        for k, v in _VARIANT_DEFAULTS.get(variant, {}).items():
            setattr(self, k, kwargs.pop(k, v))

        kwargs.setdefault("num_labels", 2)
        kwargs.setdefault("id2label", {0: "real", 1: "fake"})
        kwargs.setdefault("label2id", {"real": 0, "fake": 1})
        super().__init__(**kwargs)
import torch
import torch.nn as nn
from transformers import PreTrainedModel
from transformers.modeling_outputs import ImageClassifierOutput
from deepguard import ms_eff_gcvit_b0, ms_eff_gcvit_b5

try:
    from .configuration_ms_eff_gcvit import MsEffGCViTConfig   # Hub 로드 시
except ImportError:
    from configuration_ms_eff_gcvit import MsEffGCViTConfig    # 로컬 push 시

_BUILDERS = {"b0": ms_eff_gcvit_b0, "b5": ms_eff_gcvit_b5}


class MsEffGCViTForImageClassification(PreTrainedModel):
    config_class = MsEffGCViTConfig
    main_input_name = "pixel_values"
    all_tied_weights_keys = {}

    def __init__(self, config: MsEffGCViTConfig):
        super().__init__(config)
        builder = _BUILDERS[config.variant]
        self.model = builder(pretrained=False, dataset=config.dataset)  # 구조만, 가중치는 HF가 주입

    def forward(self, pixel_values, labels=None, **kwargs):
        logit = self.model(pixel_values)                              # [B, 1] pre-sigmoid
        logits = torch.cat([torch.zeros_like(logit), logit], dim=1)   # [B, 2] = [real, fake]

        loss = None
        if labels is not None:
            loss = nn.functional.cross_entropy(logits, labels)

        return ImageClassifierOutput(loss=loss, logits=logits)
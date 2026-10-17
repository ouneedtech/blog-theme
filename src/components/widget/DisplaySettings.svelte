<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { getDefaultHue, getHue, setHue, getFontScale, setFontScale, getFontWeightBoost, setFontWeightBoost, getFontFamily, setFontFamily } from "@utils/setting-utils";

let hue = $state(getHue());
const defaultHue = getDefaultHue();

let fontScale = $state(getFontScale());
let fontWeightBoost = $state(getFontWeightBoost());
const defaultFontScale = 1.0;
const defaultFontWeightBoost = 40;

let fontFamily = $state(getFontFamily());

function setFont(family: string) {
	fontFamily = family;
	setFontFamily(family);
}

function resetHue() {
	hue = getDefaultHue();
	setHue(hue);
}

function onHueInput(e: Event) {
	hue = parseFloat((e.target as HTMLInputElement).value);
	setHue(hue);
}

function onFontScaleInput(e: Event) {
	fontScale = parseFloat((e.target as HTMLInputElement).value);
	setFontScale(fontScale);
}

function onFontWeightInput(e: Event) {
	fontWeightBoost = parseInt((e.target as HTMLInputElement).value, 10);
	setFontWeightBoost(fontWeightBoost);
}

function resetFontScale() {
	fontScale = defaultFontScale;
	setFontScale(fontScale);
}

function resetFontWeight() {
	fontWeightBoost = defaultFontWeightBoost;
	setFontWeightBoost(fontWeightBoost);
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4">
    <!-- 主题色 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.themeColor)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md  active:scale-90 will-change-transform"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} onclick={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {hue}
            </div>
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none mb-4">
        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" value={hue}
               oninput={onHueInput}
               class="slider" id="colorSlider" step="5" style="width: 100%">
    </div>

    <!-- 字体选择 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.fontFamily)}
        </div>
    </div>
    <div class="flex gap-2 mb-4">
        <button
            class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition active:scale-95"
            class:bg-[var(--primary)]={fontFamily === 'system'}
            class:text-white={fontFamily === 'system'}
            class:bg-[var(--btn-regular-bg)]={fontFamily !== 'system'}
            class:text-[var(--btn-content)]={fontFamily !== 'system'}
            onclick={() => setFont('system')}
        >
            {i18n(I18nKey.fontSystem)}
        </button>
        <button
            class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition active:scale-95"
            class:bg-[var(--primary)]={fontFamily === 'beautified'}
            class:text-white={fontFamily === 'beautified'}
            class:bg-[var(--btn-regular-bg)]={fontFamily !== 'beautified'}
            class:text-[var(--btn-content)]={fontFamily !== 'beautified'}
            onclick={() => setFont('beautified')}
        >
            {i18n(I18nKey.fontBeautified)}
        </button>
    </div>

    <!-- 字体大小 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.fontSize)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
                    class:opacity-0={fontScale === defaultFontScale} class:pointer-events-none={fontScale === defaultFontScale} onclick={resetFontScale}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div class="transition bg-[var(--btn-regular-bg)] w-14 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {Math.round(fontScale * 100)}%
            </div>
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none mb-4">
        <input aria-label={i18n(I18nKey.fontSize)} type="range" min="0.9" max="1.25" step="0.05" value={fontScale}
               oninput={onFontScaleInput}
               class="slider" style="width: 100%">
    </div>

    <!-- 字体粗细 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.fontWeight)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
                    class:opacity-0={fontWeightBoost === defaultFontWeightBoost} class:pointer-events-none={fontWeightBoost === defaultFontWeightBoost} onclick={resetFontWeight}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div class="transition bg-[var(--btn-regular-bg)] w-14 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {400 + fontWeightBoost}
            </div>
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
        <input aria-label={i18n(I18nKey.fontWeight)} type="range" min="0" max="200" step="10" value={fontWeightBoost}
               oninput={onFontWeightInput}
               class="slider" style="width: 100%">
    </div>
</div>


<style lang="stylus">
    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

</style>

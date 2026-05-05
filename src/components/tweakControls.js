import { defineComponent, h } from 'vue'

export const TweakSection = defineComponent({
  name: 'TweakSection',
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => [
      h('div', { class: 'twk-sect' }, props.title),
      slots.default ? slots.default() : null,
    ]
  },
})

export const TweakSlider = defineComponent({
  name: 'TweakSlider',
  props: {
    label: String,
    value: Number,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    unit: { type: String, default: '' },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => h('div', { class: 'twk-row' }, [
      h('div', { class: 'twk-lbl' }, [
        h('span', props.label),
        h('span', { class: 'twk-val' }, `${props.value}${props.unit}`),
      ]),
      h('input', {
        type: 'range',
        class: 'twk-slider',
        min: props.min,
        max: props.max,
        step: props.step,
        value: props.value,
        onInput: (e) => emit('update:value', Number(e.target.value)),
      }),
    ])
  },
})

export const TweakToggle = defineComponent({
  name: 'TweakToggle',
  props: { label: String, value: Boolean },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => h('div', { class: 'twk-row twk-row-h' }, [
      h('div', { class: 'twk-lbl' }, [h('span', props.label)]),
      h('button', {
        type: 'button',
        class: 'twk-toggle',
        'data-on': props.value ? '1' : '0',
        role: 'switch',
        'aria-checked': props.value,
        onClick: () => emit('update:value', !props.value),
      }, [h('i')]),
    ])
  },
})

export const TweakSelect = defineComponent({
  name: 'TweakSelect',
  props: {
    label: String,
    value: { type: [String, Number] },
    options: { type: Array, required: true },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => h('div', { class: 'twk-row' }, [
      props.label ? h('div', { class: 'twk-lbl' }, [h('span', props.label)]) : null,
      h('select', {
        class: 'twk-field',
        value: props.value,
        onChange: (e) => emit('update:value', e.target.value),
      }, props.options.map((o) => {
        const v = typeof o === 'object' ? o.value : o
        const l = typeof o === 'object' ? o.label : o
        return h('option', { key: v, value: v }, l)
      })),
    ])
  },
})

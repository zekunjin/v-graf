import { defineComponent, ref, type ExtractPropTypes, type PropType, computed, watch } from 'vue'
import { useElementHover, useDraggable, useVModel, useElementBounding, useFocusWithin, watchThrottled } from '@vueuse/core'
import { useGraphContext } from '../graph/use-graph-context'
import { useProvideNodeContext } from './use-node-context'

const props = {
  id: { type: [String, Number], required: true },
  parent: { type: [String, Number], default: undefined },
  as: { type: String as PropType<keyof HTMLElementTagNameMap>, default: 'div' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  zIndex: { type: Number, default: 0 },
  draggable: { type: Boolean, default: true },
  isSelected: { type: Boolean, default: false }
}

export type NodeProps = ExtractPropTypes<typeof props>

export const Node = defineComponent({
  name: 'Node',

  props,

  setup (props, { emit, slots }) {
    const domRef = ref()
    const draggableRef = ref()
    const x = useVModel(props, 'x', emit)
    const y = useVModel(props, 'y', emit)
    const isSelected = useVModel(props, 'isSelected', emit)
    const isHovered = useElementHover(domRef)
    const context = useGraphContext()
    const { width, height } = useElementBounding(domRef)
    const { focused } = useFocusWithin(draggableRef)

    useProvideNodeContext({ node: { ref: domRef, bounding: { x, y, width, height } } })

    const { x: _x, y: _y } = useDraggable(domRef, {
      handle: draggableRef,

      initialValue: {
        x: x.value,
        y: y.value
      },

      containerElement: context.graph.ref.value,

      onMove (position) {
        x.value = position.x
        y.value = position.y
      }
    })

    watch(focused, (value) => {
      isSelected.value = value
      emit(value ? 'focus' : 'blur')
    })

    watch(isHovered, (value) => {
      emit(value ? 'mouseenter' : 'mouseleave')
    })

    const zIndex = computed(() => (props.zIndex + 1) * 10)

    const style = computed(() => {
      const constantStyle = { position: 'absolute', cursor: 'grab' }
      const dynamicStyle = { left: `${_x.value}px`, top: `${_y.value}px`, zIndex: zIndex.value }
      return { ...constantStyle, ...dynamicStyle }
    })

    return () => (
      <props.as ref={domRef} style={{ ...style.value }}>
        <div ref={draggableRef} tabindex="0">{slots.default?.()}</div>

        {slots.ports?.({ zIndex: zIndex.value + 1 })}
      </props.as>
    )
  }
})

import "./style.css";

import { effect, Ref, ref } from "@vue/reactivity";
import { watch } from "@vue-reactivity/watch";

type FormBuilderBase = {
	name: string;
};

type ObjectFormBuilder = FormBuilderBase & {
	type: "object";
	properties: Record<string, FormBuilder>;
};

type ArrayFormBuilder = FormBuilderBase & {
	type: "array";
	items: FormBuilder;
};

type TextFormBuilder = FormBuilderBase & {
	type: "text";
};

type FormBuilder = TextFormBuilder | ObjectFormBuilder | ArrayFormBuilder;

function createForm(builder: FormBuilder, value: unknown) {
	if (builder.type === "text") {
		return { el: createTextInput(builder, value as Ref<string>) };
	}

	if (builder.type === "array") {
		return { el: createArrayInput(builder, value as Ref<unknown[]>) };
	}

	if (builder.type === "object") {
		return { el: createObjectInput(builder, value as Ref<Record<string, unknown>>) };
	}

	throw new Error("Invalid config");
}

function createObjectInput(type: ObjectFormBuilder, value: Ref<Record<string, unknown>>) {
	const container = document.createElement("div");
	container.classList.add("object-input");

	Object.entries(type.properties).forEach(([key, objPropForm]) => {
		if (!value.value) {
			value.value = {};
		}

		const formVal = ref(value.value[key]);
		const { el } = createForm(objPropForm, formVal);
		container.appendChild(el);

		effect(() => {
			value.value[key] = formVal.value;
		});
	});

	return container;
}

function createArrayInput(type: ArrayFormBuilder, value: Ref<unknown[]>) {
	const container = document.createElement("div");
	container.classList.add("array-input");

	const increment = document.createElement("button");
	increment.textContent = "+";

	if (!value.value) {
		value.value = [""];
	}

	increment.onclick = () => {
		addArrayItem("", value.value.length);
	};

	container.appendChild(increment);

	value.value.forEach(addArrayItem);

	function addArrayItem(item: unknown, idx: number) {
		const formVal = ref(item ?? null);
		const { el } = createForm(type.items, formVal);
		container.appendChild(el);

		effect(() => {
			value.value[idx] = formVal.value;
		});
	}

	return container;
}

function createTextInput(type: TextFormBuilder, value: Ref<string>) {
	const input = document.createElement("input");

	input.value = value.value ?? "";
	input.name = type.name;

	input.oninput = () => {
		value.value = input.value;
	};

	return input;
}

/*********
 * Example
 *********/

const value = ref({});

const { el } = createForm(
	{
		type: "object",
		name: "arr",
		properties: {
			name: { type: "text", name: "name" },
			password: { type: "text", name: "password" },
			items: {
				type: "array",
				name: "items",
				items: {
					type: "text",
					name: "xxx"
				}
			},
			nestedObj: {
				type: "object",
				name: "nestedObj",
				properties: {
					name: { type: "text", name: "name" },
					password: { type: "text", name: "password" }
				}
			}
		}
	},
	value
);

document.querySelector<HTMLDivElement>("#form")!.appendChild(el);

watch(
	value,
	() => {
		document.querySelector<HTMLDivElement>("#output")!.innerHTML = JSON.stringify(
			value.value,
			null,
			2
		);
		console.log(JSON.parse(JSON.stringify(value.value)));
	},
	{
		deep: true,
		immediate: true
	}
);

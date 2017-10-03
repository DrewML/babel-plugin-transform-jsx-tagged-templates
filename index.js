const isUpper = str => str === str.toUpperCase();

module.exports = function({ types: t }) {
    const buildTemplateForElement = node => {
        if (t.isJSXText(node)) {
            return {
                quasis: [t.TemplateElement({ raw: node.value })],
                expressions: []
            };
        }

        const { name } = node.openingElement.name;
        const { attributes } = node.openingElement;
        // Quasis are the static parts of the template
        const quasis = [];
        // Expressions are the dynamic values in {}
        const expressions = [];

        let openingString = `<${name}`;

        // Build list of all dynamic props for the template
        attributes.forEach((attr, i, arr) => {
            const isOpen = i === 0;
            const shouldClose = i + 1 === arr.length;
            if (t.isJSXExpressionContainer(attr.value)) {
                expressions.push(attr.value.expression);
                quasis.push(
                    t.TemplateElement({
                        raw: `${openingString} ${attr.name.name}=`
                    })
                );
                if (shouldClose) quasis.push(t.TemplateElement({ raw: '>' }));
                return;
            }

            if (t.isStringLiteral(attr.value)) {
                quasis.push(
                    t.TemplateElement({
                        raw: `${isOpen ? openingString : ''} ${attr.name
                            .name}="${attr.value.value}"${shouldClose
                            ? '>'
                            : ''}`
                    })
                );
            }
        });
        // Add in closing char if we didn't get to in the loop above
        if (!attributes.length) {
            quasis.push(t.TemplateElement({ raw: `${openingString}>` }));
        }

        node.children.forEach((child, i) => {
            const isFirstChild = i === 0;
            const childTemplate = buildTemplateForElement(child);
            if (isFirstChild) {
                // If it's the first child, we need to append to the last-added quasi,
                // rather than adding an additional
                const { value } = childTemplate.quasis.shift();
                quasis[quasis.length - 1].value.raw += value.raw;
            }
            quasis.push.apply(quasis, childTemplate.quasis);
            expressions.push.apply(expressions, childTemplate.expressions);
        });

        const closingElement = t.TemplateElement({
            raw: `</${name}>`
        });

        // Append closing element to last static value
        quasis[quasis.length - 1].value.raw += closingElement.value.raw;

        return { quasis, expressions };
    };

    const elementToTaggedTemplate = path => {
        const { name } = path.node.openingElement.name;
        const { quasis, expressions } = buildTemplateForElement(path.node);
        const ast = t.TaggedTemplateExpression(
            t.identifier('html'),
            t.TemplateLiteral(quasis, expressions)
        );
        return ast;
    };

    return {
        visitor: {
            JSXElement(path) {
                const { name } = path.node.openingElement.name;
                if (isUpper(name[0])) {
                    throw new Error(
                        'You can only use JSX to reference DOM Elements. ' +
                            "If you're trying to reference a component implementation, " +
                            'use the tagName passed to "customElements.define" instead.'
                    );
                }

                path.replaceWith(elementToTaggedTemplate(path));
            }
        }
    };
};

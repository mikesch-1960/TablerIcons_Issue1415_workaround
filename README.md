# Tabler Icons Font Workaround

Workaround for Tabler Icons from Version 3.35+ to use the outline and filled icon fonts together.

See Issue: https://github.com/tabler/tabler-icons/issues/1415

## The Problem

Tabler's outline and filled webfonts use the same `.ti-*` class names.

For example:
```html
<i class="ti ti-heart"></i>
<i class="ti ti-heart-filled"></i>
```

When both fonts are loaded, one definition overrides the other.
This is a problem with the Tabler webfont setup rather than with the HTML usage.

## My Solution

The workaround loads the filled font CSS separately and gives the filled font its own internal class namespace.

A outline icon remains unchanged by the workaround:

```html
<i class="ti ti-heart"></i>
```

but, a filled symbol like this:

```html
<i class="ti ti-heart-filled"></i>
```

is internaly converted by the workaround to this:

```html
<i class="tibug tibug-heart"></i>
```

`ti` and `tibug` therefore refer to two different fonts:

| Icon type | Application / original class | Actual DOM class    |
| --------- | ---------------------------- | ------------------- |
| outline   | `ti ti-heart`                | `ti ti-heart`       |
| filled    | `ti ti-heart-filled`         | `tibug tibug-heart` |

The `tibug` classes are an implementation detail and should normally not be used by application code.

## Usage

Load the outline Tabler Icons CSS and include the workaround script.

Example:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.46.0/tabler-icons.min.css">

<script src="./table-icon-issue1415-workaround.js"></script>
```

Filled icons can then be used as done in Tabler versions before 3.36:

```html
<i class="ti ti-heart-filled"></i>
<i class="ti ti-star-filled"></i>
<i class="ti ti-square"></i>
```

## JavaScript

The original Tabler classes can also be manipulated through JavaScript.
For more details see the [Workaround Scrifts](#table-icon-issue1415-workaround.js) documentation in the file header.

## Public API

I also added a few public functions (see the TABLER_WA object in the script). But they are not needed for the normal usage of the workaround.
But always keep in mind that for filled icons the internal `tibug` classes are used.

### `TABLER_WA.getIconClass(element)`

Returns the original Tabler icon class represented by the element.

Examples:

```js
const element = document.querySelector('#my-icon');
const tiIconName = TABLER_WA.getIconClass(element);
```

Example results:

```text
ti-heart
ti-heart-filled
ti-brand-github
ti-brand-github-filled
```

If no Tabler icon can be found, an empty string is returned.

This function is useful when application code needs to determine which icon is currently assigned without having to know about the internal `tibug` classes.

### `TABLER_WA.replaceIcon(element, newIcon)`

Replaces the current icon with another Tabler icon.

Examples:

```js
TABLER_WA.replaceIcon(element, 'ti-heart');
TABLER_WA.replaceIcon(element, 'ti-heart-filled');
TABLER_WA.replaceIcon(element, 'ti-star');
TABLER_WA.replaceIcon(element, 'ti-star-filled');
```

The function is useful when the new icon is dynamically determined and the current icon does not need to be known by the calling code.

### `TABLER_WA.bugfixClass()`

Returns the internal base class used by the workaround:

```js
const fixedClass = TABLER_WA.bugfixClass();
```

returns by default:

```text
tibug
```

This function mainly exists for code that has a legitimate reason to interact with the workaround itself.

### Recommended approach

Use an application-specific class for visual styling:

```html
<i class="ti ti-heart-filled icon"></i>
```

```css
.icon {
    font-size: 40px;
    margin-right: 20px;
}
```

This works for both outline and filled icons, because it does not use the `ti` class that could be renamed.

# Limitations

__Always keep in mind that for filled icons, 'tibug' is used instead of 'ti'!__

The element.classList.remove() function does work, because it is overwritten by the workaround.
Perhaps it is also possible to overwrite other functions, but this is not implemented here.

## JavaScript code inspecting classes

Code that directly examines `className` or `classList` can see the internal representation.

## CSS selectors and DOM queries

The same limitation applies to selectors.

For example:

```js
element.matches('.ti-heart-filled');
```

will not match an internally converted filled icon.

Likewise:

```js
document.querySelector('.ti-heart-filled');
```

will not find the converted icon.

Selectors based on an application-specific class continue to work:

```js
document.querySelector('.icon');
```

Code using selectors such as `.ti`, `.ti-*`, or `.ti-*-filled` should therefore be reviewed if it needs to work with both outline and filled icons.

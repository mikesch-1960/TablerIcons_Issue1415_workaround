/*
Version: 2.4.0
  Added interception of DOMTokenList.remove() to handle dynamic switching between
  filled and regular Tabler icons.

Version: 2.3.0
  Added TABLER_WA object with public API.

Version: 2.0.0
  Added observer to watch for icon changes.

Version: 1.0.0
  Initial release.
_______________________________________________________________________________________________________

Workaround for Tabler 3.35+.
See issue at: https://github.com/tabler/tabler-icons/issues/1415

Tabler's outline and filled webfonts use the same .ti-* class names.
This causes conflicts when both fonts are loaded at the same time.

The workaround loads the filled font separately and renames its base
and icon classes internally:
 ti ti-heart-filled becomes tibug tibug-heart

The outline or filled font style can still be used separately as usual. The workaround is only required
for HTML code that needs to use both font styles together.
The only thing that needs to be paid attention to is that the icon 'ti-something' must always be placed
directly after the base class 'ti'!

IMPORTANT but USUAL:
To let the script work properly, it is important that only a single Tabler icon is present within the element.
In addition, the icon class must always immediately follow the base class 'ti'!


Usage:
1) Load the outline font from a CDN:
  <!-- Tabler Icons;  https://tabler.io/icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
  <!--
    NOTE: Tabler Icons from version 3.35+ can only use outline OR filled icons!
    See: https://github.com/tabler/tabler-icons/issues/1415
    To use both icon types in a project, a workaround script must be loaded. For NW apps, the script can be
    loaded with: require("../../.nw-general/tabler-missing-filled-font-wa.js");
    Filled icons can then be specified with the suffix '-filled'.  -->
2) Load the woraround script:
  Include this script into the HTML either, as a external script or inline. Nothing else is required.
  <script>
    require("../../.nw-general/tabler-missing-filled-font-wa.js");  // Workaround for Tabler Icons bug 1415
    global.nwConfig = {...

  Once the script is in use, both font styles can be used as is common in older Tabler versions, e.g.:
    <i class="ti ti-square"></i><i class="ti ti-heart-filled"></i>
  The workaround changes this to:
    <i class="ti ti-square"></i><i class="tibug tibug-heart"></i>

The integrated observer monitors all interactions with the class attributes. This means that changes made
via JavaScript are also detected and handled.
An API is included for complex cases, though its use should be avoided whenever possible:

Public API:
 TABLER_WA.getIconClass(element)
   Returns the original Tabler icon class, e.g. "ti-heart" or
   "ti-heart-filled". Returns an empty string if no icon is found.

 TABLER_WA.replaceIcon(element, newIcon)
   Replaces the current icon with the specified Tabler icon.

 TABLER_WA.bugfixClass()
   Returns the internal base class used for filled icons ("tibug").

Limitations:
 CSS selectors for filled icons no longer match their original classes, because they are internally
 renamed to 'tibug'.
 General styling should therefore use a separate class, or the parent element:
   .icon { ... }
   .i { ... }

 Code that directly inspects className or classList do see the internal "tibug" classe for filled icons.
 The API-function TABLER_WA.getIconClass() returns the original icon class.

 Code that specifically searches for "ti" or "ti-..." in classList may therefore behave differently
 or filled icons. The same applies to code using querySelector(), matches(), closest() or other DOM/CSS
 selector mechanisms with the original filled class names.

 The MutationObserver only reacts to actual changes of the class attribute. A classList.remove() call
 for a class that is not present does not produce a mutation. This normally does not cause a problem when
 changing an icon by removing the old class and adding the new class.

Function principle:
  1. The regular Tabler CSS must be loaded normally before.
  2. The filled font CSS is fetched separately.
  3. Its font definition and icon definitions are copied into a new <style> element.
  4. Filled icon classes are renamed from ti-name-filled to tibug-name.
  5. Existing and newly added by JavaScript icons are converted accordingly.

*/

const EXTRA_CLASSNAME = 'tibug';


// public API
const TABLER_WA = {

  // Returns the class name of the EXTRA_CLASSNAME
  bugfixClass() { return EXTRA_CLASSNAME; },


  // Returns the original Tabler icon class, e.g. "ti-heart" or "ti-heart-filled" or an empty string if no icon is found
  getIconClass(element) {
    if (!element?.classList) return '';

    const elClasses = [...element.classList];
    const baseIndex = elClasses.findIndex(cls => cls === 'ti' || cls === EXTRA_CLASSNAME);
    if (baseIndex < 0 || !elClasses[baseIndex + 1])
      return false;

    if (elClasses[baseIndex] === EXTRA_CLASSNAME) {
      const iconName = elClasses[baseIndex + 1].slice(EXTRA_CLASSNAME.length + 1);  // Remove the tibug- prefix
      return `ti-${iconName}-filled`;
    }

    return elClasses[baseIndex + 1];
  },


  // Replaces the current icon with the specified Tabler icon.
  // Only the name of a single valid tabler icon is replaced. Additional classes are ignored.
  replaceIcon(element, byIcon) {
    if (!element?.classList || typeof byIcon !== 'string' || !byIcon.startsWith('ti-'))
      return false;

    // Make sure we only have a single tabler icon and remove the 'ti-' prefix
    let newIcon = byIcon.split(' ')[0];
    newIcon = newIcon.replace(/^ti-/, '');       // Remove the 'ti-' prefix

    const elClasses = [...element.classList];
    const baseIndex = elClasses.findIndex(cls => cls === 'ti' || cls === EXTRA_CLASSNAME);
    if (baseIndex < 0 || !elClasses[baseIndex + 1])
      return false;

    const isFilled = newIcon.endsWith('-filled');   // Check if the new icon is a filled icon
    newIcon = newIcon.replace('-filled', '');       // Remove an existing '-filled' suffix

    elClasses[baseIndex] = isFilled ? EXTRA_CLASSNAME : 'ti';      // Assign the correct base class
    elClasses[baseIndex + 1] = `${elClasses[baseIndex]}-${newIcon}`;   // Assign the new icon class

    element.className = elClasses.join(' ');

    return true;
  }

};

// The following code is executed when the script is loaded. This is the actual function for the workaround.

(function () {
// /*
  // Determine the CDN base URL from the regular Tabler CSS in the html head
  const tablerCSS    = document.querySelector('link[href*="/tabler-icons.min.css"]');
  const CDN_BASE_URL = tablerCSS ? new URL('.', tablerCSS.href).href : '';
  // If none is found, log a warning and exit
  if (!CDN_BASE_URL) {
    console.warn('🚧 Tabler Icons workaround-script: Could find a tabler CSS link in the html head.');
    return;
  }
// OR */
  // Set the CDN base URL as a constant
  // const CDN_BASE_URL   = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.46.0/dist/';

  const CDN_FILLED_URL = CDN_BASE_URL + 'tabler-icons-filled.min.css';

  //### Einfacher: wenn es ein -filled icon war dann data-tabler-filled="true" zum element hinzufügen?!

  const originalRemove = DOMTokenList.prototype.remove;
  const originalAdd    = DOMTokenList.prototype.add;
  DOMTokenList.prototype.remove = function (...tokens) {
    for (const token of tokens) {
      if (
        token.startsWith('ti-') && token.endsWith('-filled')
      ) {
        const iconName = token.slice(
          'ti-'.length,
          -'-filled'.length
        );

        const tibugIconClass = `${EXTRA_CLASSNAME}-${iconName}`;
        const classes        = [...this];
        const tibugIdx       = classes.indexOf(EXTRA_CLASSNAME);

        if (
          tibugIdx !== -1 &&
          classes[tibugIdx + 1] === tibugIconClass
        ) {
          // Restore f.e.: tibug tibug-heart  -> ti ti-heart-filled

          // By using the original functions, the observer is not triggered
          originalRemove.call(this, EXTRA_CLASSNAME);
          originalAdd.call(this, 'ti');

          originalRemove.call(this, tibugIconClass);
          originalAdd.call(this, token);
        }
      }
    }

    return originalRemove.apply(this, tokens);
  };

  const originalContains = DOMTokenList.prototype.contains;
  DOMTokenList.prototype.contains = function (string) {
    if (string.startsWith('ti-') && string.endsWith('-filled')) {
      const iconName = string.slice(
        'ti-'.length,
        -'-filled'.length
      );
      const tibugIconClass = `${EXTRA_CLASSNAME}-${iconName}`;
      return originalContains.call(this, tibugIconClass);
    }

    if (string === 'ti') {  // This could alse be called with 'tibug'
      return originalContains.call(this, 'ti') || originalContains.call(this, EXTRA_CLASSNAME);
    }

    // If the icon is not a filled icon, the original function is called
    return originalContains.apply(this, arguments);
  };

  // Convert a filled Tabler icon to the internal tibug classes
  function applyWorkaroundToElement(iconEl) {
    const elClasses = [...iconEl.classList];               // Collect the classes of the element as an array
    if (!elClasses || elClasses.length < 2) return;        // Check if the element has at least 2 classes

    const clsIdx = elClasses.findIndex(cls => cls.startsWith('ti-') && cls.endsWith('-filled'));

    // See if it is a filled icon and has a base class
    if (clsIdx > 0 && elClasses[clsIdx - 1]) {                  // Check if the icon is a filled one and has a base class
      const iconName = elClasses[clsIdx].slice('ti-'.length, -'-filled'.length);  // Get the clean name
      elClasses[clsIdx - 1] = EXTRA_CLASSNAME;                  // Assign the corrected base class
      elClasses[clsIdx]     = `${EXTRA_CLASSNAME}-${iconName}`; // Assign the corrected icon class

      iconEl.className = elClasses.join(' ');                   // Update the element's className
      return;
    }

    return;
  }


  function applyWorkaroundToDOM(root = document) {
    if (root.nodeType === Node.ELEMENT_NODE) applyWorkaroundToElement(root);  // Apply to the element itself

    root.querySelectorAll?.('[class]').forEach(el => {
      if ([...el.classList].some(cls => cls.startsWith('ti-') && cls.endsWith('-filled'))) {
        applyWorkaroundToElement(el);
      }
    });
  }


  // Catch icons added or changed by JavaScript
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        applyWorkaroundToElement(mutation.target);
      } else {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) applyWorkaroundToDOM(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class']
  });


  fetch(CDN_FILLED_URL)
    .then(response => {
      if (!response.ok) throw new Error('Filled-CSS could not be loaded.');
      return response.text();
    })
    .then(css => {
      // Extract the font-face definition and point its font URL to the same CDN
      const fontFace = css.match(/@font-face\s*{[^}]*}/)?.[0]?.replaceAll('url("./', `url("${CDN_BASE_URL}`) ?? '';

      // Use tibug as the base class for the filled font
      const newBaseClass = css.match(/\.ti\s*{[^}]+}/)?.[0]?.replace('.ti', `.${EXTRA_CLASSNAME}`) ?? '';

      // Extract the filled icon definitions
      const iconRegex = /\.ti-([a-z0-9-]+):before\s*{[^}]*content\s*:\s*[^;}]+[^}]*}/gi;
      const tablerFilledIcons = [];
      let match;

      while ((match = iconRegex.exec(css)) !== null) {
        tablerFilledIcons.push(match[0].replace('.ti-', `.${EXTRA_CLASSNAME}-`));
      }

      // Create a new <style> element and add the font face, base class and icon definitions
      const style = document.createElement('style');
      style.textContent = `${fontFace}\n\n${newBaseClass}\n\n${tablerFilledIcons.join('\n')}`;
      document.head.appendChild(style);

      // Process icons that appeared while the CSS was loading
      applyWorkaroundToDOM(document.body);

      console.info('🚧 Tabler Icons workaround-script for issue 1415 applied.');
    })
    .catch(error => console.error('Tabler Icons workaround:', error));
})();
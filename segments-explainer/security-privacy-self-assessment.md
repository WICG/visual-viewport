# Security and Privacy Questionnaire

[Security and Privacy questionnaire](https://www.w3.org/TR/security-privacy-questionnaire/)
responses for the Viewport Segments API

### 2.1. What information might this feature expose to Web sites or other parties, and for what purposes is that exposure necessary?

This API exposes the concept of Viewport Segments, which represent the regions of the window that reside on separate (adjacent) displays or across a seamless folding screen. Viewport Segments apply only to device with a foldable screen or dual screens devices (devices with two screens connected with a physical hinge). The segments information comes from the platform.

In order for developers to take advantage of the new devices, they need to know how they are being used so they can implement better responsive design in their application. Here are few simple use cases:

- Avoid placing content in the fold/hinge area (like buttons).
- Providing a split user interface to leverage the additional screen estate.

### 2.2. Is this specification exposing the minimum amount of information necessary to power the feature?

The API design only exposes a defined set rectangles provided by the OS/platform in viewport coordinates.

### 2.4. How does this specification deal with sensitive information?

The information exposed by this API are not sensitive information. Viewport Segments are logical divisions of the viewport area which is already exposed.

### 2.5. Does this specification introduce new state for an origin that persists across browsing sessions?

This API does not introduce any new persistent state per say, because the Viewport Segments can change across browsing sessions, but they can also be the same.

### 2.6. What information from the underlying platform, e.g. configuration data, is exposed by this specification to an origin?

Aside from the viewport segments values, nothing else is exposed.

### 2.7. Does this specification allow an origin access to sensors on a user’s device

This specification does not allow direct access to sensors.

### 2.8. What data does this specification expose to an origin? Please also document what data is identical to data exposed by other features, in the same or different contexts.

See answer question 1.

### 2.9. Does this specification enable new script execution/loading mechanisms?

No.

### 2.10. Does this specification allow an origin to access other devices?

No.

### 2.11. Does this specification allow an origin some measure of control over a user agent’s native UI?

No.

### 2.12. What temporary identifiers might this specification create or expose to the web?

The Viewport Segments API could be used to identify whether the device is a foldable device. While Viewport Segments values could potentially be specific to a given model of a foldable device because segment dimensions could be unique, the same device could also be targeted using the viewport width/height in a similar fashion as the viewport global dimensions could be unique (as explained on question 4, viewport segments are subdivision of the whole viewport).

### 2.13. How does this specification distinguish between behavior in first-party and third-party contexts?

The specified API will be available in third-party contexts via iframe, either through CSS or JavaScript.

### 2.14. How does this specification work in the context of a user agent’s Private Browsing or "incognito" mode?

The API works the same way in Private Browsing / "incognito". It is high level enough to prevent identification between a private or normal browsing mode.

### 2.15. Does this specification have a "Security Considerations" and "Privacy Considerations" section?

Yes. The JS API will fold into the visual viewport specification, the CSS API is part of the CSS Media Queries Level 5.

### 2.16. Does this specification allow downgrading default security characteristics?

No.

### 2.17. What should this questionnaire have asked?

We think that the questions here accurately capture the API's security and privacy implications.
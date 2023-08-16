import {I18nManager} from 'react-native';
import Onyx from 'react-native-onyx';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';
import platformSetup from './platformSetup';
import * as Metrics from '../libs/Metrics';
import * as Device from '../libs/actions/Device';
import intlPolyfill from '../libs/IntlPolyfill';

export default function () {
    /*
     * Initialize the Onyx store when the app loads for the first time.
     *
     * Note: This Onyx initialization has been very intentionally placed completely outside of the React lifecycle of the main App component.
     *
     * To understand why we must do this, you must first understand that a typical React Native Android application consists of an Application and an Activity.
     * The project root's index.js runs in the Application, but the main RN `App` component + UI runs in a separate Activity, spawned when you call AppRegistry.registerComponent.
     * When an application launches in a headless JS context (i.e: when woken from a killed state by a push notification), only the Application is available, but not the UI Activity.
     * This means that in a headless context NO REACT CODE IS EXECUTED, and none of your components will mount.
     *
     * However, we still need to use Onyx to update the underlying app data from the headless JS context.
     * Therefore it must be initialized completely outside the React component lifecycle.
     */
    Onyx.init({
        keys: ONYXKEYS,

        // Increase the cached key count so that the app works more consistently for accounts with large numbers of reports
        maxCachedKeysCount: 10000,
        safeEvictionKeys: [ONYXKEYS.COLLECTION.REPORT_ACTIONS],
        captureMetrics: Metrics.canCaptureOnyxMetrics(),
        initialKeyStates: {
            // Clear any loading and error messages so they do not appear on app startup
            [ONYXKEYS.SESSION]: {loading: false},
            [ONYXKEYS.ACCOUNT]: CONST.DEFAULT_ACCOUNT_DATA,
            [ONYXKEYS.NETWORK]: {isOffline: false},
            [ONYXKEYS.IS_SIDEBAR_LOADED]: false,
            [ONYXKEYS.SHOULD_SHOW_COMPOSE_INPUT]: true,
            [ONYXKEYS.MODAL]: {
                isVisible: false,
                willAlertModalBecomeVisible: false,
            },
        },
    });

    // When enabled we will skip persisting to disk any server-side downloaded objects (e.g. workspaces, chats, etc) that can hog up a user's resources.
    window.enableMemoryOnlyKeys = () => {
        // eslint-disable-next-line rulesdir/prefer-actions-set-data
        Onyx.set(ONYXKEYS.IS_USING_MEMORY_ONLY_KEYS, true);
        Onyx.setMemoryOnlyKeys([ONYXKEYS.COLLECTION.REPORT, ONYXKEYS.COLLECTION.POLICY, ONYXKEYS.PERSONAL_DETAILS_LIST]);
    };

    window.disableMemoryOnlyKeys = () => {
        // eslint-disable-next-line rulesdir/prefer-actions-set-data
        Onyx.set(ONYXKEYS.IS_USING_MEMORY_ONLY_KEYS, false);
        Onyx.setMemoryOnlyKeys([]);
    };

    Device.setDeviceID();

    // Force app layout to work left to right because our design does not currently support devices using this mode
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);

    // Polyfill the Intl API if locale data is not as expected
    intlPolyfill();

    // Perform any other platform-specific setup
    platformSetup();
}

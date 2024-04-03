import { Drawer } from 'vaul';

export default function VaulDrawer() {
    return (
        <Drawer.Root>
            <Drawer.Trigger>Open</Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Content>
                    <p>Content</p>
                </Drawer.Content>
                <Drawer.Overlay />
            </Drawer.Portal>
        </Drawer.Root>
    );
}
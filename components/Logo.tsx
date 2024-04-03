import Image from 'next/image'
import favicon from '~/public/favicon.svg'

export default function Logo() {
    return (
        <Image
            src={favicon}
            alt="Picture of the author"
            width={36}
            height={36}
        />
    );
}
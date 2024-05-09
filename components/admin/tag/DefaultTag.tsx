'use client'

import { Card, CardBody, CardFooter, CardHeader, Chip, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react'
import React from 'react'
import { ArrowDown10 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DefaultTag() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        delay: 0.5,
        ease: [0, 0.71, 0.2, 1.01]
      }}
    >
      <Card shadow="sm" className="h-64">
        <CardHeader className="flex gap-3">
          <p>首页</p>
          <Popover placement="top" shadow="sm">
            <PopoverTrigger className="cursor-pointer">
              <Chip className="select-none" color="success" variant="shadow" aria-label="路由">/</Chip>
            </PopoverTrigger>
            <PopoverContent>
              <div className="px-1 py-2 select-none">
                <div className="text-small font-bold">路由</div>
                <div className="text-tiny">可以访问的一级路径</div>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardBody>
          <p>首页为默认路由，无法调整</p>
        </CardBody>
        <CardFooter className="flex space-x-1 select-none">
          <Chip color="success" variant="shadow">显示</Chip>
          <Popover placement="top" shadow="sm">
            <PopoverTrigger className="cursor-pointer">
              <Chip
                color="primary"
                variant="shadow"
                startContent={<ArrowDown10 size={20} />}
                aria-label="排序"
              >-1</Chip>
            </PopoverTrigger>
            <PopoverContent>
              <div className="px-1 py-2 select-none">
                <div className="text-small font-bold">排序</div>
                <div className="text-tiny">首页优先级最高</div>
              </div>
            </PopoverContent>
          </Popover>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
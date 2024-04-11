'use client'

import { Button, Select, SelectItem } from '@nextui-org/react'
import {CardHeader} from "@nextui-org/card";

export default async function UploadSelect() {
  const animals = [
    {label: "Cat", value: "cat", description: "The second most popular pet in the world"},
    {label: "Dog", value: "dog", description: "The most popular pet in the world"},
    {label: "Elephant", value: "elephant", description: "The largest land animal"},
  ];

  const storages = [
    {
      label: 'S3',
      value: 's3',
    },
    {
      label: 'AList',
      value: 'alist',
    }
  ]

  return (
    <CardHeader className="justify-between space-x-1">
      <Select
        isRequired
        color="primary"
        variant="bordered"
        label="存储"
        placeholder="请选择存储"
        defaultSelectedKeys={["cat"]}
      >
        {storages.map((storage) => (
          <SelectItem key={storage.value} value={storage.value}>
            {storage.label}
          </SelectItem>
        ))}
      </Select>
      <Select
        isRequired
        color="secondary"
        variant="bordered"
        label="标签"
        placeholder="请选择标签"
        defaultSelectedKeys={["cat"]}
      >
        {animals.map((animal) => (
          <SelectItem key={animal.value} value={animal.value}>
            {animal.label}
          </SelectItem>
        ))}
      </Select>
    </CardHeader>
  )
}
